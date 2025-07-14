import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import GoalService, { CreateGoalData, GoalFilters } from '@/services/goal.service'

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['bonding', 'development', 'personal_growth', 'relationship']).optional(),
  targetDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  progress: z.number().min(0).max(100).default(0),
})

const getGoalsSchema = z.object({
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  completed: z.string().optional().transform(str => str === 'true' ? true : str === 'false' ? false : undefined),
  targetDateFrom: z.string().optional().transform(str => str ? new Date(str) : undefined),
  targetDateTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
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
    
    const validatedQuery = getGoalsSchema.parse(query)
    const page = parseInt(validatedQuery.page)
    const limit = parseInt(validatedQuery.limit)
    const skip = (page - 1) * limit

    // Build filters
    const filters: GoalFilters = {
      category: validatedQuery.category,
      priority: validatedQuery.priority,
      completed: validatedQuery.completed,
      targetDateFrom: validatedQuery.targetDateFrom,
      targetDateTo: validatedQuery.targetDateTo,
    }

    // Get goals with pagination
    const goals = await GoalService.getUserGoals(user.id, filters)
    const paginatedGoals = goals.slice(skip, skip + limit)

    // Get goal statistics
    const stats = await GoalService.getGoalStats(user.id)
    const categoryStats = await GoalService.getGoalsByCategory(user.id)

    return NextResponse.json({
      goals: paginatedGoals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(goals.length / limit),
        totalItems: goals.length,
        itemsPerPage: limit,
      },
      stats,
      categoryStats,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error fetching goals:', error)
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
    const validatedData = createGoalSchema.parse(body)

    // Create goal data
    const goalData: CreateGoalData = {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      targetDate: validatedData.targetDate,
      priority: validatedData.priority,
      progress: validatedData.progress,
    }

    // Create goal
    const goal = await GoalService.createGoal(user.id, goalData)

    return NextResponse.json({
      message: 'Goal created successfully',
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        targetDate: goal.targetDate,
        priority: goal.priority,
        progress: goal.progress,
        completed: goal.completed,
        createdAt: goal.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 