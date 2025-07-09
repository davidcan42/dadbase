import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
      // For now, we'll create a simple mock response
      // TODO: Replace with actual OpenAI integration
      const aiResponse = await generateAIResponse(validatedData.content, user.fatherProfile)
      
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
        const newTitle = generateThreadTitle(validatedData.content)
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

// Mock AI response function - to be replaced with OpenAI integration
async function generateAIResponse(userMessage: string, fatherProfile: any) {
  // This is a temporary mock response
  // TODO: Replace with actual OpenAI API call
  
  const responses = [
    "I understand you're looking for guidance. As a father, it's natural to have questions and concerns. Can you tell me more about what's on your mind?",
    "That's a great question. Based on Dr. Anna Machin's research, fathers play a unique role in child development. Let me share some insights that might help.",
    "I hear you. Being a father can be both rewarding and challenging. What specific aspect would you like to explore further?",
    "Thank you for sharing that with me. Every father's journey is different, and it's important to find what works best for you and your family.",
    "That's something many fathers experience. Let me provide some evidence-based guidance that might be helpful in your situation."
  ]

  // Add some context based on father profile if available
  let response = responses[Math.floor(Math.random() * responses.length)]
  
  if (fatherProfile?.fatherName) {
    response = `Hi ${fatherProfile.fatherName}, ${response}`
  }

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return response
}

// Generate thread title from first message
function generateThreadTitle(message: string): string {
  // Simple title generation - can be enhanced later
  const words = message.split(' ').slice(0, 5).join(' ')
  return words.length > 40 ? words.substring(0, 40) + '...' : words
} 