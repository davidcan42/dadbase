import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import AnalyticsService from '@/services/analytics.service'

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
    const type = searchParams.get('type') || 'all'

    let insights = {}

    if (type === 'predictive' || type === 'all') {
      insights = {
        ...insights,
        predictiveInsights: await AnalyticsService.getPredictiveInsights(user.id)
      }
    }

    if (type === 'trends' || type === 'all') {
      insights = {
        ...insights,
        trendAnalysis: await AnalyticsService.getTrendAnalysis(user.id)
      }
    }

    return NextResponse.json({
      success: true,
      data: insights
    })

  } catch (error) {
    console.error('Error fetching analytics insights:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 