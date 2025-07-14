import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shareGoalSchema = z.object({
  goalId: z.string(),
  privacyLevel: z.enum(['private', 'family', 'community', 'public']).default('community'),
  shareType: z.enum(['achievement', 'progress', 'milestone']),
  message: z.string().optional(),
  sharedWith: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'challenges'

    if (type === 'challenges') {
      const challenges = await prisma.communityChallenge.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: { 
              id: true, 
              fatherProfile: { 
                select: { fatherName: true } 
              } 
            }
          },
          participants: {
            select: { 
              id: true, 
              userId: true, 
              progress: true, 
              completed: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      return NextResponse.json({
        success: true,
        data: { challenges }
      })
    }

    if (type === 'shared-goals') {
      const sharedGoals = await prisma.goalShare.findMany({
        where: {
          OR: [
            { sharedWith: user.id },
            { privacyLevel: 'community' },
            { privacyLevel: 'public' }
          ]
        },
        include: {
          goal: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              priority: true,
              progress: true,
              completed: true
            }
          },
          sharer: {
            select: {
              id: true,
              fatherProfile: {
                select: { fatherName: true }
              }
            }
          }
        },
        orderBy: { sharedAt: 'desc' },
        take: 20
      })

      return NextResponse.json({
        success: true,
        data: { sharedGoals }
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching community data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, data } = body

    if (action === 'shareGoal') {
      const validatedData = shareGoalSchema.parse(data)
      
      // Verify user owns the goal
      const goal = await prisma.goal.findUnique({
        where: { 
          id: validatedData.goalId,
          userId: user.id
        }
      })

      if (!goal) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }

      // Create goal share
      const goalShare = await prisma.goalShare.create({
        data: {
          goalId: validatedData.goalId,
          sharedBy: user.id,
          sharedWith: validatedData.sharedWith,
          privacyLevel: validatedData.privacyLevel,
          shareType: validatedData.shareType,
          message: validatedData.message
        }
      })

      return NextResponse.json({
        success: true,
        data: { goalShare },
        message: 'Goal shared successfully'
      })
    }

    if (action === 'joinChallenge') {
      const { challengeId } = data
      
      if (!challengeId) {
        return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
      }

      // Check if challenge exists and is active
      const challenge = await prisma.communityChallenge.findUnique({
        where: { id: challengeId, isActive: true }
      })

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 })
      }

      // Check if user is already participating
      const existing = await prisma.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: user.id
          }
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'Already participating in this challenge' }, { status: 400 })
      }

      // Join challenge
      const participation = await prisma.challengeParticipant.create({
        data: {
          challengeId,
          userId: user.id
        }
      })

      return NextResponse.json({
        success: true,
        data: { participation },
        message: 'Successfully joined challenge'
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: shareGoal, joinChallenge' 
    }, { status: 400 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error handling community action:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 