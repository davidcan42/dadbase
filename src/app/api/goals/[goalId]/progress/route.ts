import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import GoalService from '@/services/goal.service'

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { goalId } = await params

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)

    // Update goal progress
    const updatedGoal = await GoalService.updateGoalProgress(user.id, goalId, validatedData.progress)

    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Goal progress updated successfully',
      goal: updatedGoal
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating goal progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 