import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createThreadSchema = z.object({
  title: z.string().optional(),
  initialMessage: z.string().optional()
})

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all chat threads for the user
    const threads = await prisma.chatThread.findMany({
      where: {
        userId: user.id,
        isArchived: false
      },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ 
      threads: threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        messageCount: thread._count.messages,
        lastMessage: thread.messages[0]?.content || null,
        lastMessageTime: thread.messages[0]?.timestamp || thread.createdAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      }))
    })

  } catch (error) {
    console.error('Error fetching chat threads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createThreadSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create new chat thread
    const thread = await prisma.chatThread.create({
      data: {
        userId: user.id,
        title: validatedData.title || 'New Chat',
      }
    })

    // If there's an initial message, add it to the thread
    if (validatedData.initialMessage) {
      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          content: validatedData.initialMessage,
          role: 'user'
        }
      })
    }

    return NextResponse.json({ 
      thread: {
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error creating chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 