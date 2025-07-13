import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateAIResponse, findRelevantContent, generateThreadTitle, ChatMessage, UserProfile } from '@/lib/openai'

const sendMessageSchema = z.object({
  threadId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']).default('user')
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

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

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        threadId: validatedData.threadId,
        content: validatedData.content,
        role: validatedData.role,
        timestamp: new Date()
      }
    })

    // Update thread timestamp
    await prisma.chatThread.update({
      where: { id: validatedData.threadId },
      data: { updatedAt: new Date() }
    })

    // If it's a user message, generate AI response
    if (validatedData.role === 'user') {
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
        validatedData.content,
        userProfile,
        3
      )

      // Generate AI response with context
      const aiResponse = await generateAIResponse(
        validatedData.content,
        formattedHistory,
        userProfile,
        relevantContent
      )
      
      // Save AI response
      const aiMessage = await prisma.chatMessage.create({
        data: {
          threadId: validatedData.threadId,
          content: aiResponse,
          role: 'assistant',
          timestamp: new Date()
        }
      })

      // Update thread title if it's the first message
      if (thread.title === 'New Chat') {
        const newTitle = await generateThreadTitle(validatedData.content)
        await prisma.chatThread.update({
          where: { id: validatedData.threadId },
          data: { title: newTitle }
        })
      }

      return NextResponse.json({ 
        messages: [
          {
            id: userMessage.id,
            content: userMessage.content,
            role: userMessage.role,
            timestamp: userMessage.timestamp
          },
          {
            id: aiMessage.id,
            content: aiMessage.content,
            role: aiMessage.role,
            timestamp: aiMessage.timestamp
          }
        ]
      })
    }

    return NextResponse.json({ 
      message: {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        timestamp: userMessage.timestamp
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

 