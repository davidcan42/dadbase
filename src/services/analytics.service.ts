import { prisma } from '@/lib/prisma'
import { Goal } from '@/generated/prisma'

export interface AnalyticsMetrics {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  overdueGoals: number
  completionRate: number
  averageCompletionTime: number
  categoryPerformance: CategoryPerformance[]
  monthlyTrends: MonthlyTrend[]
  weeklyProgress: WeeklyProgress[]
  priorityDistribution: PriorityDistribution[]
  upcomingDeadlines: UpcomingDeadline[]
}

export interface CategoryPerformance {
  category: string
  totalGoals: number
  completedGoals: number
  completionRate: number
  averageProgress: number
  averageCompletionTime: number
}

export interface MonthlyTrend {
  month: string
  year: number
  goalsCreated: number
  goalsCompleted: number
  completionRate: number
  averageProgress: number
}

export interface WeeklyProgress {
  week: string
  weekStart: Date
  weekEnd: Date
  goalsWorkedOn: number
  progressMade: number
  goalsCompleted: number
}

export interface PriorityDistribution {
  priority: string
  count: number
  completionRate: number
  averageCompletionTime: number
}

export interface UpcomingDeadline {
  goalId: string
  title: string
  targetDate: Date
  daysUntilDeadline: number
  progress: number
  priority: string
  category: string
}

export interface PredictiveInsights {
  goalCompletionPrediction: number
  likelyCompletionDate: Date | null
  riskFactors: string[]
  recommendations: string[]
  seasonalPatterns: SeasonalPattern[]
}

export interface SeasonalPattern {
  season: string
  completionRate: number
  popularCategories: string[]
  averageGoalDuration: number
}

export interface TrendAnalysis {
  completionTrend: 'improving' | 'declining' | 'stable'
  productivityScore: number
  consistencyScore: number
  focusScore: number
  burnoutRisk: 'low' | 'medium' | 'high'
  suggestions: string[]
}

export class AnalyticsService {
  // Get comprehensive analytics dashboard data
  static async getDashboardAnalytics(userId: string): Promise<AnalyticsMetrics> {
    try {
      const [
        totalGoals,
        completedGoals,
        activeGoals,
        overdueGoals,
        categoryPerformance,
        monthlyTrends,
        weeklyProgress,
        priorityDistribution,
        upcomingDeadlines
      ] = await Promise.all([
        this.getTotalGoals(userId),
        this.getCompletedGoals(userId),
        this.getActiveGoals(userId),
        this.getOverdueGoals(userId),
        this.getCategoryPerformance(userId),
        this.getMonthlyTrends(userId),
        this.getWeeklyProgress(userId),
        this.getPriorityDistribution(userId),
        this.getUpcomingDeadlines(userId)
      ])

      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      const averageCompletionTime = await this.getAverageCompletionTime(userId)

      return {
        totalGoals,
        completedGoals,
        activeGoals,
        overdueGoals,
        completionRate,
        averageCompletionTime,
        categoryPerformance,
        monthlyTrends,
        weeklyProgress,
        priorityDistribution,
        upcomingDeadlines
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
      throw new Error('Failed to fetch analytics')
    }
  }

  // Track goal events for analytics
  static async trackGoalEvent(
    userId: string,
    goalId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        select: { category: true, priority: true }
      })

      await prisma.goalAnalytics.create({
        data: {
          userId,
          goalId,
          eventType,
          eventData,
          category: goal?.category,
          priority: goal?.priority
        }
      })
    } catch (error) {
      console.error('Error tracking goal event:', error)
      throw new Error('Failed to track goal event')
    }
  }

  // Get predictive insights
  static async getPredictiveInsights(userId: string): Promise<PredictiveInsights> {
    try {
      const [
        completionPrediction,
        likelyCompletionDate,
        riskFactors,
        recommendations,
        seasonalPatterns
      ] = await Promise.all([
        this.calculateCompletionPrediction(userId),
        this.calculateLikelyCompletionDate(userId),
        this.identifyRiskFactors(userId),
        this.generateRecommendations(userId),
        this.getSeasonalPatterns(userId)
      ])

      return {
        goalCompletionPrediction: completionPrediction,
        likelyCompletionDate,
        riskFactors,
        recommendations,
        seasonalPatterns
      }
    } catch (error) {
      console.error('Error getting predictive insights:', error)
      throw new Error('Failed to get predictive insights')
    }
  }

  // Get trend analysis
  static async getTrendAnalysis(userId: string): Promise<TrendAnalysis> {
    try {
      const [
        completionTrend,
        productivityScore,
        consistencyScore,
        focusScore,
        burnoutRisk
      ] = await Promise.all([
        this.calculateCompletionTrend(userId),
        this.calculateProductivityScore(userId),
        this.calculateConsistencyScore(userId),
        this.calculateFocusScore(userId),
        this.assessBurnoutRisk(userId)
      ])

      const suggestions = this.generateTrendSuggestions(
        completionTrend,
        productivityScore,
        consistencyScore,
        focusScore,
        burnoutRisk
      )

      return {
        completionTrend,
        productivityScore,
        consistencyScore,
        focusScore,
        burnoutRisk,
        suggestions
      }
    } catch (error) {
      console.error('Error getting trend analysis:', error)
      throw new Error('Failed to get trend analysis')
    }
  }

  // Helper methods for analytics calculations
  private static async getTotalGoals(userId: string): Promise<number> {
    return await prisma.goal.count({ where: { userId } })
  }

  private static async getCompletedGoals(userId: string): Promise<number> {
    return await prisma.goal.count({ where: { userId, completed: true } })
  }

  private static async getActiveGoals(userId: string): Promise<number> {
    return await prisma.goal.count({ where: { userId, completed: false } })
  }

  private static async getOverdueGoals(userId: string): Promise<number> {
    return await prisma.goal.count({
      where: {
        userId,
        completed: false,
        targetDate: { lt: new Date() }
      }
    })
  }

  private static async getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
    const categories = ['bonding', 'development', 'personal_growth', 'relationship']
    const categoryPerformance: CategoryPerformance[] = []

    for (const category of categories) {
      const [totalGoals, completedGoals, avgProgress] = await Promise.all([
        prisma.goal.count({ where: { userId, category } }),
        prisma.goal.count({ where: { userId, category, completed: true } }),
        prisma.goal.aggregate({
          where: { userId, category },
          _avg: { progress: true }
        })
      ])

      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      const averageCompletionTime = await this.getAverageCompletionTimeByCategory(userId, category)

      categoryPerformance.push({
        category,
        totalGoals,
        completedGoals,
        completionRate,
        averageProgress: Math.round(avgProgress._avg.progress || 0),
        averageCompletionTime
      })
    }

    return categoryPerformance
  }

  private static async getMonthlyTrends(userId: string): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const [goalsCreated, goalsCompleted, avgProgress] = await Promise.all([
        prisma.goal.count({
          where: {
            userId,
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.goal.count({
          where: {
            userId,
            completed: true,
            updatedAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.goal.aggregate({
          where: {
            userId,
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _avg: { progress: true }
        })
      ])

      const completionRate = goalsCreated > 0 ? Math.round((goalsCompleted / goalsCreated) * 100) : 0

      trends.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: monthStart.getFullYear(),
        goalsCreated,
        goalsCompleted,
        completionRate,
        averageProgress: Math.round(avgProgress._avg.progress || 0)
      })
    }

    return trends
  }

  private static async getWeeklyProgress(userId: string): Promise<WeeklyProgress[]> {
    const progress: WeeklyProgress[] = []
    const now = new Date()
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
      
      const [goalsWorkedOn, goalsCompleted, analytics] = await Promise.all([
        prisma.goal.count({
          where: {
            userId,
            updatedAt: { gte: weekStart, lte: weekEnd }
          }
        }),
        prisma.goal.count({
          where: {
            userId,
            completed: true,
            updatedAt: { gte: weekStart, lte: weekEnd }
          }
        }),
        prisma.goalAnalytics.findMany({
          where: {
            userId,
            eventType: 'progress_updated',
            createdAt: { gte: weekStart, lte: weekEnd }
          }
        })
      ])

      const progressMade = analytics.reduce((sum, event) => {
        const eventData = event.eventData as any
        return sum + (eventData.progressChange || 0)
      }, 0)

      progress.push({
        week: `Week ${8 - i}`,
        weekStart,
        weekEnd,
        goalsWorkedOn,
        progressMade,
        goalsCompleted
      })
    }

    return progress
  }

  private static async getPriorityDistribution(userId: string): Promise<PriorityDistribution[]> {
    const priorities = ['low', 'medium', 'high']
    const distribution: PriorityDistribution[] = []

    for (const priority of priorities) {
      const [count, completedCount] = await Promise.all([
        prisma.goal.count({ where: { userId, priority } }),
        prisma.goal.count({ where: { userId, priority, completed: true } })
      ])

      const completionRate = count > 0 ? Math.round((completedCount / count) * 100) : 0
      const averageCompletionTime = await this.getAverageCompletionTimeByPriority(userId, priority)

      distribution.push({
        priority,
        count,
        completionRate,
        averageCompletionTime
      })
    }

    return distribution
  }

  private static async getUpcomingDeadlines(userId: string): Promise<UpcomingDeadline[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now

    const goals = await prisma.goal.findMany({
      where: {
        userId,
        completed: false,
        targetDate: {
          gte: now,
          lte: futureDate
        }
      },
      orderBy: { targetDate: 'asc' },
      take: 10
    })

    return goals.map(goal => ({
      goalId: goal.id,
      title: goal.title,
      targetDate: goal.targetDate!,
      daysUntilDeadline: Math.ceil((goal.targetDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      progress: goal.progress,
      priority: goal.priority,
      category: goal.category || 'general'
    }))
  }

  private static async getAverageCompletionTime(userId: string): Promise<number> {
    const completedGoals = await prisma.goal.findMany({
      where: { userId, completed: true },
      select: { createdAt: true, updatedAt: true }
    })

    if (completedGoals.length === 0) return 0

    const totalTime = completedGoals.reduce((sum, goal) => {
      const completionTime = goal.updatedAt.getTime() - goal.createdAt.getTime()
      return sum + completionTime
    }, 0)

    return Math.round(totalTime / completedGoals.length / (1000 * 60 * 60 * 24)) // Convert to days
  }

  private static async getAverageCompletionTimeByCategory(userId: string, category: string): Promise<number> {
    const completedGoals = await prisma.goal.findMany({
      where: { userId, category, completed: true },
      select: { createdAt: true, updatedAt: true }
    })

    if (completedGoals.length === 0) return 0

    const totalTime = completedGoals.reduce((sum, goal) => {
      const completionTime = goal.updatedAt.getTime() - goal.createdAt.getTime()
      return sum + completionTime
    }, 0)

    return Math.round(totalTime / completedGoals.length / (1000 * 60 * 60 * 24))
  }

  private static async getAverageCompletionTimeByPriority(userId: string, priority: string): Promise<number> {
    const completedGoals = await prisma.goal.findMany({
      where: { userId, priority, completed: true },
      select: { createdAt: true, updatedAt: true }
    })

    if (completedGoals.length === 0) return 0

    const totalTime = completedGoals.reduce((sum, goal) => {
      const completionTime = goal.updatedAt.getTime() - goal.createdAt.getTime()
      return sum + completionTime
    }, 0)

    return Math.round(totalTime / completedGoals.length / (1000 * 60 * 60 * 24))
  }

  // Predictive analytics methods
  private static async calculateCompletionPrediction(userId: string): Promise<number> {
    const recentAnalytics = await prisma.goalAnalytics.findMany({
      where: {
        userId,
        eventType: 'progress_updated',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    if (recentAnalytics.length === 0) return 50

    const averageProgress = recentAnalytics.reduce((sum, event) => {
      const eventData = event.eventData as any
      return sum + (eventData.progressChange || 0)
    }, 0) / recentAnalytics.length

    return Math.min(Math.max(averageProgress * 10, 0), 100)
  }

  private static async calculateLikelyCompletionDate(userId: string): Promise<Date | null> {
    const activeGoals = await prisma.goal.findMany({
      where: { userId, completed: false },
      select: { progress: true, createdAt: true }
    })

    if (activeGoals.length === 0) return null

    const averageProgress = activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length
    const averageAge = activeGoals.reduce((sum, goal) => {
      return sum + (Date.now() - goal.createdAt.getTime())
    }, 0) / activeGoals.length

    const progressRate = averageProgress / (averageAge / (1000 * 60 * 60 * 24))
    const remainingProgress = 100 - averageProgress
    const daysToComplete = progressRate > 0 ? remainingProgress / progressRate : 30

    return new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000)
  }

  private static async identifyRiskFactors(userId: string): Promise<string[]> {
    const riskFactors: string[] = []
    
    const [overdueCount, lowProgressCount, inactiveCount] = await Promise.all([
      prisma.goal.count({
        where: {
          userId,
          completed: false,
          targetDate: { lt: new Date() }
        }
      }),
      prisma.goal.count({
        where: {
          userId,
          completed: false,
          progress: { lt: 25 }
        }
      }),
      prisma.goal.count({
        where: {
          userId,
          completed: false,
          updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    if (overdueCount > 0) {
      riskFactors.push(`${overdueCount} overdue goals`)
    }
    if (lowProgressCount > 2) {
      riskFactors.push(`${lowProgressCount} goals with low progress`)
    }
    if (inactiveCount > 1) {
      riskFactors.push(`${inactiveCount} inactive goals`)
    }

    return riskFactors
  }

  private static async generateRecommendations(userId: string): Promise<string[]> {
    const recommendations: string[] = []
    
    const [categoryStats, priorityStats] = await Promise.all([
      this.getCategoryPerformance(userId),
      this.getPriorityDistribution(userId)
    ])

    const weakestCategory = categoryStats.reduce((prev, curr) => 
      prev.completionRate < curr.completionRate ? prev : curr
    )

    if (weakestCategory.completionRate < 50) {
      recommendations.push(`Focus on improving ${weakestCategory.category} goals`)
    }

    const highPriorityPerformance = priorityStats.find(p => p.priority === 'high')
    if (highPriorityPerformance && highPriorityPerformance.completionRate < 70) {
      recommendations.push('Prioritize high-priority goals for better outcomes')
    }

    recommendations.push('Consider breaking large goals into smaller milestones')
    recommendations.push('Set realistic deadlines based on your completion history')

    return recommendations
  }

  private static async getSeasonalPatterns(userId: string): Promise<SeasonalPattern[]> {
    // This would analyze historical data by seasons
    // For now, return placeholder data
    return [
      {
        season: 'Spring',
        completionRate: 75,
        popularCategories: ['development', 'bonding'],
        averageGoalDuration: 21
      },
      {
        season: 'Summer',
        completionRate: 80,
        popularCategories: ['bonding', 'personal_growth'],
        averageGoalDuration: 18
      },
      {
        season: 'Fall',
        completionRate: 70,
        popularCategories: ['relationship', 'development'],
        averageGoalDuration: 25
      },
      {
        season: 'Winter',
        completionRate: 65,
        popularCategories: ['personal_growth', 'relationship'],
        averageGoalDuration: 30
      }
    ]
  }

  // Trend analysis methods
  private static async calculateCompletionTrend(userId: string): Promise<'improving' | 'declining' | 'stable'> {
    const recentMonths = await this.getMonthlyTrends(userId)
    if (recentMonths.length < 3) return 'stable'

    const recent = recentMonths.slice(-3)
    const earlier = recentMonths.slice(-6, -3)

    const recentAvg = recent.reduce((sum, month) => sum + month.completionRate, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, month) => sum + month.completionRate, 0) / earlier.length

    const difference = recentAvg - earlierAvg
    
    if (difference > 5) return 'improving'
    if (difference < -5) return 'declining'
    return 'stable'
  }

  private static async calculateProductivityScore(userId: string): Promise<number> {
    const [totalGoals, completedGoals, avgProgress] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, completed: true } }),
      prisma.goal.aggregate({
        where: { userId },
        _avg: { progress: true }
      })
    ])

    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
    const averageProgress = avgProgress._avg.progress || 0

    return Math.round((completionRate * 0.6) + (averageProgress * 0.4))
  }

  private static async calculateConsistencyScore(userId: string): Promise<number> {
    const weeklyProgress = await this.getWeeklyProgress(userId)
    const activeWeeks = weeklyProgress.filter(week => week.goalsWorkedOn > 0).length
    const consistencyScore = (activeWeeks / weeklyProgress.length) * 100

    return Math.round(consistencyScore)
  }

  private static async calculateFocusScore(userId: string): Promise<number> {
    const activeGoals = await prisma.goal.count({
      where: { userId, completed: false }
    })

    const categorySpread = await prisma.goal.groupBy({
      by: ['category'],
      where: { userId, completed: false },
      _count: { category: true }
    })

    const focusScore = activeGoals <= 5 ? 100 : Math.max(20, 100 - (activeGoals - 5) * 10)
    const categoryFocusScore = categorySpread.length <= 2 ? 100 : Math.max(20, 100 - (categorySpread.length - 2) * 20)

    return Math.round((focusScore + categoryFocusScore) / 2)
  }

  private static async assessBurnoutRisk(userId: string): Promise<'low' | 'medium' | 'high'> {
    const [activeGoals, overdueGoals, recentActivity] = await Promise.all([
      prisma.goal.count({ where: { userId, completed: false } }),
      prisma.goal.count({
        where: {
          userId,
          completed: false,
          targetDate: { lt: new Date() }
        }
      }),
      prisma.goalAnalytics.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    const riskFactors = [
      activeGoals > 10,
      overdueGoals > 3,
      recentActivity < 2
    ].filter(Boolean).length

    if (riskFactors >= 2) return 'high'
    if (riskFactors === 1) return 'medium'
    return 'low'
  }

  private static generateTrendSuggestions(
    completionTrend: 'improving' | 'declining' | 'stable',
    productivityScore: number,
    consistencyScore: number,
    focusScore: number,
    burnoutRisk: 'low' | 'medium' | 'high'
  ): string[] {
    const suggestions: string[] = []

    if (completionTrend === 'declining') {
      suggestions.push('Review your goal-setting strategy and adjust expectations')
    }

    if (productivityScore < 60) {
      suggestions.push('Consider breaking goals into smaller, more manageable tasks')
    }

    if (consistencyScore < 50) {
      suggestions.push('Establish a regular routine for working on your goals')
    }

    if (focusScore < 70) {
      suggestions.push('Limit active goals to 3-5 to improve focus and completion rates')
    }

    if (burnoutRisk === 'high') {
      suggestions.push('Take a break and reassess your goal priorities')
    }

    return suggestions
  }
}

export default AnalyticsService 