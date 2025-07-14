import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { goalId, shareLevel } = await request.json()

    if (!goalId || !shareLevel) {
      return NextResponse.json({ error: 'Goal ID and share level are required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the goal belongs to the user
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: user.id
      }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Check if goal is already shared
    const existingShare = await prisma.goalShare.findFirst({
      where: {
        goalId: goalId,
        sharedBy: user.id
      }
    })

    if (existingShare) {
      // Update existing share
      const updatedShare = await prisma.goalShare.update({
        where: { id: existingShare.id },
        data: { privacyLevel: shareLevel }
      })
      return NextResponse.json({ share: updatedShare })
    } else {
      // Create new share
      const newShare = await prisma.goalShare.create({
        data: {
          goalId: goalId,
          sharedBy: user.id,
          privacyLevel: shareLevel,
          shareType: 'progress',
          message: `A dad shared a goal with the community!`
        }
      })
      return NextResponse.json({ share: newShare })
    }

  } catch (error) {
    console.error('Error sharing goal:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

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

    // Get user's shared goals
    const sharedGoals = await prisma.goalShare.findMany({
      where: { sharedBy: user.id },
      include: {
        goal: true,
        sharer: {
          select: {
            id: true,
            clerkId: true,
            email: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' }
    })

    return NextResponse.json({ sharedGoals })

  } catch (error) {
    console.error('Error fetching shared goals:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 