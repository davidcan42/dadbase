import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  contentType: z.array(z.string()).optional(),
  targetAge: z.array(z.string()).optional(),
  complexity: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
  includeBookmarked: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = searchSchema.parse(body)

    // Get user to check if they exist in our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { fatherProfile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const page = parseInt(validatedData.page)
    const limit = parseInt(validatedData.limit)
    const skip = (page - 1) * limit

    // Build search where clause
    const where: any = {
      AND: []
    }

    // Full text search across title, content, and summary
    if (validatedData.query) {
      where.AND.push({
        OR: [
          { title: { contains: validatedData.query, mode: 'insensitive' } },
          { content: { contains: validatedData.query, mode: 'insensitive' } },
          { summary: { contains: validatedData.query, mode: 'insensitive' } },
          { themes: { hasSome: validatedData.query.split(' ') } }
        ]
      })
    }

    // Content type filter
    if (validatedData.contentType && validatedData.contentType.length > 0) {
      where.AND.push({ contentType: { in: validatedData.contentType } })
    }

    // Target age filter
    if (validatedData.targetAge && validatedData.targetAge.length > 0) {
      where.AND.push({ targetAge: { in: validatedData.targetAge } })
    }

    // Complexity filter
    if (validatedData.complexity && validatedData.complexity.length > 0) {
      where.AND.push({ complexity: { in: validatedData.complexity } })
    }

    // Themes filter
    if (validatedData.themes && validatedData.themes.length > 0) {
      where.AND.push({ themes: { hassome: validatedData.themes } })
    }

    // If user only wants bookmarked content
    if (validatedData.includeBookmarked) {
      where.AND.push({
        bookmarks: {
          some: { userId: user.id }
        }
      })
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }
    if (validatedData.sortBy === 'popularity') {
      orderBy = { bookmarks: { _count: 'desc' } }
    } else if (validatedData.sortBy === 'date') {
      orderBy = { createdAt: 'desc' }
    }
    // For relevance, we'll use default ordering for now
    // TODO: Implement proper relevance scoring

    // Execute search
    const [contentItems, totalCount] = await Promise.all([
      prisma.contentItem.findMany({
        where: where.AND.length > 0 ? where : {},
        include: {
          bookmarks: {
            where: { userId: user.id },
            select: { id: true, notes: true, createdAt: true }
          },
          progressEntries: {
            where: { userId: user.id },
            select: { progressType: true, progressValue: true }
          },
          _count: {
            select: { bookmarks: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.contentItem.count({ where: where.AND.length > 0 ? where : {} })
    ])

    // Calculate relevance score (simple implementation for now)
    const searchResults = contentItems.map(item => {
      let relevanceScore = 0
      const queryLower = validatedData.query.toLowerCase()
      
      // Title match gets highest score
      if (item.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10
      }
      
      // Summary match gets medium score
      if (item.summary && item.summary.toLowerCase().includes(queryLower)) {
        relevanceScore += 5
      }
      
      // Content match gets lower score
      if (item.content.toLowerCase().includes(queryLower)) {
        relevanceScore += 2
      }
      
      // Theme match gets bonus
      if (item.themes.some(theme => theme.toLowerCase().includes(queryLower))) {
        relevanceScore += 3
      }

      return {
        ...item,
        relevanceScore
      }
    })

    // Sort by relevance if requested
    if (validatedData.sortBy === 'relevance') {
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Get personalized recommendations based on user profile
    const recommendations = await getPersonalizedRecommendations(user, validatedData.query)

    return NextResponse.json({
      results: searchResults.map(item => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        sourceReference: item.sourceReference,
        summary: item.summary,
        targetAge: item.targetAge,
        themes: item.themes,
        complexity: item.complexity,
        bookmarkCount: item._count.bookmarks,
        isBookmarked: item.bookmarks.length > 0,
        userBookmark: item.bookmarks[0] || null,
        userProgress: item.progressEntries[0] || null,
        relevanceScore: item.relevanceScore,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      recommendations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      searchMetadata: {
        query: validatedData.query,
        sortBy: validatedData.sortBy,
        appliedFilters: {
          contentType: validatedData.contentType,
          targetAge: validatedData.targetAge,
          complexity: validatedData.complexity,
          themes: validatedData.themes
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error searching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get personalized recommendations
async function getPersonalizedRecommendations(user: any, searchQuery: string) {
  const fatherProfile = user.fatherProfile
  
  if (!fatherProfile) {
    return []
  }

  // Build recommendation criteria based on user profile
  const recommendationWhere: any = {
    AND: []
  }

  // Recommend content based on children's ages
  if (fatherProfile.childrenAges && fatherProfile.childrenAges.length > 0) {
    const ageCategories = fatherProfile.childrenAges.map((age: number) => {
      if (age <= 2) return 'newborn'
      if (age <= 5) return 'toddler'
      if (age <= 12) return 'child'
      return 'teenager'
    })
    
    recommendationWhere.AND.push({
      targetAge: { in: ageCategories }
    })
  }

  // Recommend content based on user's primary concerns
  if (fatherProfile.primaryConcerns && fatherProfile.primaryConcerns.length > 0) {
    const concernThemes = fatherProfile.primaryConcerns.map((concern: string) => {
      // Map concerns to themes
      if (concern.includes('sleep')) return 'sleep'
      if (concern.includes('discipline')) return 'discipline'
      if (concern.includes('communication')) return 'communication'
      if (concern.includes('development')) return 'development'
      if (concern.includes('stress')) return 'mental-health'
      return 'general'
    })
    
    recommendationWhere.AND.push({
      themes: { hasSome: concernThemes }
    })
  }

  // Recommend content based on goals
  if (fatherProfile.fatheringGoals && fatherProfile.fatheringGoals.length > 0) {
    const goalThemes = fatherProfile.fatheringGoals.map((goal: string) => {
      if (goal.includes('bonding')) return 'bonding'
      if (goal.includes('communication')) return 'communication'
      if (goal.includes('development')) return 'development'
      if (goal.includes('confidence')) return 'confidence'
      if (goal.includes('balance')) return 'work-life-balance'
      return 'general'
    })
    
    recommendationWhere.AND.push({
      themes: { hasSome: goalThemes }
    })
  }

  // Exclude content the user has already bookmarked
  recommendationWhere.AND.push({
    bookmarks: {
      none: { userId: user.id }
    }
  })

  try {
    const recommendations = await prisma.contentItem.findMany({
      where: recommendationWhere.AND.length > 0 ? recommendationWhere : {},
      include: {
        _count: {
          select: { bookmarks: true }
        }
      },
      orderBy: [
        { bookmarks: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 5
    })

    return recommendations.map(item => ({
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      summary: item.summary,
      targetAge: item.targetAge,
      themes: item.themes,
      complexity: item.complexity,
      bookmarkCount: item._count.bookmarks,
      reason: 'Based on your profile and interests'
    }))
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return []
  }
} 