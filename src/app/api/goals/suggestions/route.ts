import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import GoalService from '@/services/goal.service'

const suggestionsSchema = z.object({
  chatContext: z.string().optional(),
  threadId: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = suggestionsSchema.parse(query)

    // Get chat context if thread ID is provided
    let chatContext = validatedQuery.chatContext
    if (validatedQuery.threadId) {
      const thread = await prisma.chatThread.findFirst({
        where: {
          id: validatedQuery.threadId,
          userId: user.id
        },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      })

      if (thread) {
        chatContext = thread.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      }
    }

    // Get goal suggestions
    const suggestions = await GoalService.suggestGoals(user.id, chatContext)

    return NextResponse.json({
      suggestions,
      message: 'Goal suggestions retrieved successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error getting goal suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = suggestionsSchema.parse(body)

    // Get goal suggestions with custom context
    const suggestions = await GoalService.suggestGoals(user.id, validatedData.chatContext)

    return NextResponse.json({
      suggestions,
      message: 'Goal suggestions retrieved successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error getting goal suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 