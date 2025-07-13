import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateAIResponse, findRelevantContent, generateThreadTitle, ChatMessage, UserProfile } from '@/lib/openai'
import OpenAI from 'openai'

const streamMessageSchema = z.object({
  threadId: z.string().min(1),
  message: z.string().min(1),
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = streamMessageSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { fatherProfile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify thread belongs to user
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: validatedData.threadId,
        userId: user.id
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Save user message first
    const userMessage = await prisma.chatMessage.create({
      data: {
        threadId: validatedData.threadId,
        content: validatedData.message,
        role: 'user',
        timestamp: new Date()
      }
    })

    // Get chat history for context
    const chatHistory = await prisma.chatMessage.findMany({
      where: { threadId: validatedData.threadId },
      orderBy: { timestamp: 'asc' },
      select: {
        content: true,
        role: true,
        timestamp: true
      }
    })

    // Convert to ChatMessage format for OpenAI
    const formattedHistory: ChatMessage[] = chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp
    }))

    // Get user profile for context
    const userProfile: UserProfile | null = user.fatherProfile ? {
      fatherName: user.fatherProfile.fatherName || undefined,
      childrenAges: user.fatherProfile.childrenAges || undefined,
      relationshipStatus: user.fatherProfile.relationshipStatus || undefined,
      primaryConcerns: user.fatherProfile.primaryConcerns || undefined,
      fatheringGoals: user.fatherProfile.fatheringGoals || undefined,
      communicationStyle: user.fatherProfile.communicationStyle || undefined
    } : null

    // Find relevant content to provide context
    const relevantContent = await findRelevantContent(
      validatedData.message,
      userProfile,
      3
    )

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build context for OpenAI
          let userContext = ''
          if (userProfile) {
            userContext = `\n\nUser Context:
- Father's name: ${userProfile.fatherName || 'Not provided'}
- Children's ages: ${userProfile.childrenAges?.join(', ') || 'Not provided'}
- Relationship status: ${userProfile.relationshipStatus || 'Not provided'}
- Primary concerns: ${userProfile.primaryConcerns?.join(', ') || 'Not provided'}
- Fathering goals: ${userProfile.fatheringGoals?.join(', ') || 'Not provided'}
- Communication style: ${userProfile.communicationStyle || 'Not provided'}`
          }

          let relevantContentContext = ''
          if (relevantContent && relevantContent.length > 0) {
            relevantContentContext = `\n\nRelevant Research Context:
${relevantContent.join('\n\n')}`
          }

          const systemPrompt = `You are Dr. Anna Machin's AI assistant for fathers, specializing in evidence-based fatherhood support. 

Your expertise includes:
- Paternal neuroscience and hormonal changes in fathers
- Father-child bonding and attachment
- Child development from a father's perspective
- "Rough and tumble" play and its importance
- Supporting fathers through different life stages
- Work-life balance for fathers
- Mental health and emotional wellbeing for fathers

Guidelines:
- Provide evidence-based advice grounded in scientific research
- Be supportive, understanding, and non-judgmental
- Reference Dr. Anna Machin's research when relevant
- Acknowledge the unique role fathers play in child development
- Offer practical, actionable advice
- Be sensitive to different family structures and situations
- Encourage fathers to seek professional help when needed

Always maintain a warm, supportive tone while being scientifically accurate.${userContext}${relevantContentContext}`

          // Build messages array for OpenAI
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
              role: 'system',
              content: systemPrompt
            }
          ]

          // Add recent chat history (limit to last 10 messages)
          const recentHistory = formattedHistory.slice(-10)
          recentHistory.forEach(msg => {
            messages.push({
              role: msg.role,
              content: msg.content
            })
          })

          // Create streaming completion
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages,
            max_tokens: 500,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
            stream: true,
          })

          let fullResponse = ''

          // Process streaming response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              fullResponse += content
              
              // Send chunk to client
              const chunkData = {
                type: 'chunk',
                content: content,
                timestamp: new Date().toISOString()
              }
              
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`)
              )
            }
          }

          // Save the complete AI response to database
          const aiMessage = await prisma.chatMessage.create({
            data: {
              threadId: validatedData.threadId,
              content: fullResponse,
              role: 'assistant',
              timestamp: new Date()
            }
          })

          // Update thread timestamp
          await prisma.chatThread.update({
            where: { id: validatedData.threadId },
            data: { updatedAt: new Date() }
          })

          // Update thread title if it's the first message
          if (thread.title === 'New Chat') {
            const newTitle = await generateThreadTitle(validatedData.message)
            await prisma.chatThread.update({
              where: { id: validatedData.threadId },
              data: { title: newTitle }
            })
          }

          // Send completion signal
          const completionData = {
            type: 'complete',
            messageId: aiMessage.id,
            timestamp: new Date().toISOString()
          }
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(completionData)}\n\n`)
          )

          controller.close()

        } catch (error) {
          console.error('Error in streaming response:', error)
          
          // Send error to client
          const errorData = {
            type: 'error',
            error: 'An error occurred while processing your message',
            timestamp: new Date().toISOString()
          }
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`)
          )
          
          controller.close()
        }
      }
    })

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error in streaming chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 