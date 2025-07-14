import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import AchievementService from '@/services/achievement.service'

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

    let responseData = {}

    if (type === 'summary' || type === 'all') {
      responseData = {
        ...responseData,
        summary: await AchievementService.getAchievementSummary(user.id)
      }
    }

    if (type === 'achievements' || type === 'all') {
      responseData = {
        ...responseData,
        achievements: await AchievementService.getUserAchievements(user.id)
      }
    }

    if (type === 'streaks' || type === 'all') {
      responseData = {
        ...responseData,
        streaks: await AchievementService.getStreakData(user.id)
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error fetching achievements:', error)
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

    if (action === 'checkNewAchievements') {
      // Check for new achievements
      const newAchievements = await AchievementService.checkAndAwardAchievements(user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          newAchievements,
          hasNewAchievements: newAchievements.length > 0
        }
      })
    }

    if (action === 'updateStreak') {
      const { streakType } = data
      if (!streakType || !['daily', 'weekly', 'monthly'].includes(streakType)) {
        return NextResponse.json({ 
          error: 'Invalid streak type. Must be daily, weekly, or monthly' 
        }, { status: 400 })
      }

      await AchievementService.updateStreak(user.id, streakType)
      
      return NextResponse.json({
        success: true,
        message: 'Streak updated successfully'
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: checkNewAchievements, updateStreak' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error handling achievement action:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 