import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import RecommendationService from '@/services/recommendation.service'
import { z } from 'zod'

const recommendationQuerySchema = z.object({
  type: z.enum(['personalized', 'chat', 'next', 'seasonal', 'improvement']).default('personalized'),
  limit: z.string().optional().default('10'),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  maxDuration: z.string().optional(),
  targetAge: z.string().optional(),
  prioritizeStrengths: z.string().optional(),
  addressWeaknesses: z.string().optional(),
  seasonal: z.string().optional(),
  chatContext: z.string().optional(),
  completedGoalId: z.string().optional(),
  season: z.string().optional(),
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
    
    const validatedQuery = recommendationQuerySchema.parse(query)
    const limit = parseInt(validatedQuery.limit)

    // Build filters
    const filters = {
      category: validatedQuery.category,
      difficulty: validatedQuery.difficulty,
      maxDuration: validatedQuery.maxDuration ? parseInt(validatedQuery.maxDuration) : undefined,
      targetAge: validatedQuery.targetAge,
      prioritizeStrengths: validatedQuery.prioritizeStrengths === 'true',
      addressWeaknesses: validatedQuery.addressWeaknesses === 'true',
      seasonal: validatedQuery.seasonal === 'true',
    }

    let recommendations = []

    switch (validatedQuery.type) {
      case 'personalized':
        recommendations = await RecommendationService.getPersonalizedRecommendations(
          user.id,
          limit,
          filters
        )
        break

      case 'chat':
        if (!validatedQuery.chatContext) {
          return NextResponse.json({ 
            error: 'Chat context is required for chat-based recommendations' 
          }, { status: 400 })
        }
        recommendations = await RecommendationService.getChatBasedRecommendations(
          user.id,
          validatedQuery.chatContext,
          limit
        )
        break

      case 'next':
        if (!validatedQuery.completedGoalId) {
          return NextResponse.json({ 
            error: 'Completed goal ID is required for next goal recommendations' 
          }, { status: 400 })
        }
        recommendations = await RecommendationService.getNextGoalRecommendations(
          user.id,
          validatedQuery.completedGoalId,
          limit
        )
        break

      case 'seasonal':
        const season = validatedQuery.season || getCurrentSeason()
        recommendations = await RecommendationService.getSeasonalRecommendations(
          user.id,
          season,
          limit
        )
        break

      case 'improvement':
        recommendations = await RecommendationService.getImprovementRecommendations(
          user.id,
          limit
        )
        break

      default:
        return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        type: validatedQuery.type,
        filters,
        total: recommendations.length
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error fetching recommendations:', error)
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

    if (action === 'acceptRecommendation') {
      const { recommendationId } = data
      
      if (!recommendationId) {
        return NextResponse.json({ 
          error: 'Recommendation ID is required' 
        }, { status: 400 })
      }

      // Get the recommendation (this would typically be stored in a cache or database)
      // For now, we'll fetch it again from the service
      const recommendations = await RecommendationService.getPersonalizedRecommendations(user.id, 50)
      const recommendation = recommendations.find(r => r.id === recommendationId)

      if (!recommendation) {
        return NextResponse.json({ 
          error: 'Recommendation not found' 
        }, { status: 404 })
      }

      // Convert recommendation to goal data
      const goalData = RecommendationService.recommendationToGoalData(recommendation)

      // Create the goal
      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          ...goalData
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          goal,
          message: 'Recommendation accepted and goal created'
        }
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: acceptRecommendation' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error handling recommendation action:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// Helper function to get current season
function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
} 