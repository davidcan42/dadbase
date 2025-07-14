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

    // Get report data
    const [goals, achievements, streaks] = await Promise.all([
      prisma.goal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.achievement.findMany({
        where: { userId: user.id },
        orderBy: { earnedAt: 'desc' }
      }),
      prisma.goalStreak.findMany({
        where: { userId: user.id }
      })
    ])

    // Calculate stats
    const totalGoals = goals.length
    const completedGoals = goals.filter(g => g.completed).length
    const activeGoals = goals.filter(g => !g.completed).length
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

    // Calculate category breakdown
    const categoryBreakdown = goals.reduce((acc: any, goal) => {
      const category = goal.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = { total: 0, completed: 0, completionRate: 0 }
      }
      acc[category].total++
      if (goal.completed) {
        acc[category].completed++
      }
      acc[category].completionRate = Math.round((acc[category].completed / acc[category].total) * 100)
      return acc
    }, {})

    // Calculate monthly progress
    const monthlyProgress = goals.reduce((acc: any, goal) => {
      const month = new Date(goal.createdAt).toISOString().slice(0, 7) // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { goalsCreated: 0, goalsCompleted: 0, completionRate: 0 }
      }
      acc[month].goalsCreated++
      if (goal.completed) {
        acc[month].goalsCompleted++
      }
      acc[month].completionRate = Math.round((acc[month].goalsCompleted / acc[month].goalsCreated) * 100)
      return acc
    }, {})

    // Get current streak data
    const currentStreak = streaks.find(s => s.streakType === 'daily')?.currentCount || 0
    const longestStreak = Math.max(...streaks.map(s => s.longestCount), 0)

    const reportData = {
      totalGoals,
      completedGoals,
      activeGoals,
      completionRate,
      streakData: {
        currentStreak,
        longestStreak,
        totalDays: streaks.reduce((sum, s) => sum + s.currentCount, 0)
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]: [string, any]) => ({
        category,
        total: data.total,
        completed: data.completed,
        completionRate: data.completionRate
      })),
      monthlyProgress: Object.entries(monthlyProgress).map(([month, data]: [string, any]) => ({
        month,
        goalsCreated: data.goalsCreated,
        goalsCompleted: data.goalsCompleted,
        completionRate: data.completionRate
      })),
      achievements: achievements.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dateEarned: a.earnedAt.toISOString(),
        type: a.type
      })),
      recentGoals: goals.slice(0, 10).map(g => ({
        id: g.id,
        title: g.title,
        status: g.completed ? 'completed' : 'active',
        progress: g.progress
      }))
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 