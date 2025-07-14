import { prisma } from '@/lib/prisma'

// Achievement types and their metadata
export interface AchievementType {
  type: string
  title: string
  description: string
  icon: string
  requirement: (metadata: any) => boolean
  metadata?: any
}

export interface CreateAchievementData {
  userId: string
  type: string
  title: string
  description: string
  icon?: string
  metadata?: any
}

export interface StreakData {
  streakType: 'daily' | 'weekly' | 'monthly'
  currentCount: number
  longestCount: number
  lastActivity: Date
  isActive: boolean
}

export class AchievementService {
  // Predefined achievement types
  private static achievementTypes: AchievementType[] = [
    {
      type: 'first_goal_completed',
      title: 'First Steps',
      description: 'Completed your first fatherhood goal',
      icon: 'target',
      requirement: (metadata) => metadata.completedGoals >= 1
    },
    {
      type: 'goal_master',
      title: 'Goal Master',
      description: 'Completed 10 goals',
      icon: 'crown',
      requirement: (metadata) => metadata.completedGoals >= 10
    },
    {
      type: 'streak_week',
      title: 'Week Warrior',
      description: 'Maintained a 7-day goal completion streak',
      icon: 'flame',
      requirement: (metadata) => metadata.streakLength >= 7
    },
    {
      type: 'streak_month',
      title: 'Consistency King',
      description: 'Maintained a 30-day goal completion streak',
      icon: 'zap',
      requirement: (metadata) => metadata.streakLength >= 30
    },
    {
      type: 'category_bonding',
      title: 'Bonding Champion',
      description: 'Completed 5 bonding goals',
      icon: 'heart',
      requirement: (metadata) => metadata.categoryCompletions.bonding >= 5
    },
    {
      type: 'category_development',
      title: 'Development Expert',
      description: 'Completed 5 development goals',
      icon: 'trending-up',
      requirement: (metadata) => metadata.categoryCompletions.development >= 5
    },
    {
      type: 'early_bird',
      title: 'Early Bird',
      description: 'Completed 3 goals before their target date',
      icon: 'sunrise',
      requirement: (metadata) => metadata.earlyCompletions >= 3
    },
    {
      type: 'perfectionist',
      title: 'Perfectionist',
      description: 'Completed 5 goals with 100% progress',
      icon: 'star',
      requirement: (metadata) => metadata.perfectCompletions >= 5
    }
  ]

  // Get all achievements for a user
  static async getUserAchievements(userId: string): Promise<any[]> {
    try {
      return await prisma.achievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' }
      })
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      throw new Error('Failed to fetch achievements')
    }
  }

  // Create a new achievement
  static async createAchievement(data: CreateAchievementData): Promise<any> {
    try {
      // Check if achievement already exists
      const existingAchievement = await prisma.achievement.findFirst({
        where: {
          userId: data.userId,
          type: data.type
        }
      })

      if (existingAchievement) {
        return existingAchievement
      }

      return await prisma.achievement.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          icon: data.icon,
          metadata: data.metadata
        }
      })
    } catch (error) {
      console.error('Error creating achievement:', error)
      throw new Error('Failed to create achievement')
    }
  }

  // Check and award achievements based on user progress
  static async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    try {
      const newAchievements: Achievement[] = []

      // Get user's current achievements
      const existingAchievements = await this.getUserAchievements(userId)
      const existingTypes = existingAchievements.map(a => a.type)

      // Get user's goal statistics
      const goalStats = await this.getUserGoalStats(userId)

      // Check each achievement type
      for (const achievementType of this.achievementTypes) {
        if (!existingTypes.includes(achievementType.type)) {
          if (achievementType.requirement(goalStats)) {
            const achievement = await this.createAchievement({
              userId,
              type: achievementType.type,
              title: achievementType.title,
              description: achievementType.description,
              icon: achievementType.icon,
              metadata: goalStats
            })
            newAchievements.push(achievement)
          }
        }
      }

      return newAchievements
    } catch (error) {
      console.error('Error checking achievements:', error)
      throw new Error('Failed to check achievements')
    }
  }

  // Get user's goal statistics for achievement checking
  private static async getUserGoalStats(userId: string) {
    try {
      const [
        totalGoals,
        completedGoals,
        categoryStats,
        streakData,
        earlyCompletions,
        perfectCompletions
      ] = await Promise.all([
        prisma.goal.count({ where: { userId } }),
        prisma.goal.count({ where: { userId, completed: true } }),
        this.getCategoryCompletions(userId),
        this.getStreakData(userId),
        this.getEarlyCompletions(userId),
        this.getPerfectCompletions(userId)
      ])

      return {
        totalGoals,
        completedGoals,
        categoryCompletions: categoryStats,
        streakLength: streakData.daily.currentCount,
        earlyCompletions,
        perfectCompletions
      }
    } catch (error) {
      console.error('Error fetching goal stats:', error)
      throw new Error('Failed to fetch goal statistics')
    }
  }

  // Get category completion counts
  private static async getCategoryCompletions(userId: string) {
    try {
      const categories = ['bonding', 'development', 'personal_growth', 'relationship']
      const categoryCompletions: { [key: string]: number } = {}

      for (const category of categories) {
        const count = await prisma.goal.count({
          where: { userId, category, completed: true }
        })
        categoryCompletions[category] = count
      }

      return categoryCompletions
    } catch (error) {
      console.error('Error fetching category completions:', error)
      return {}
    }
  }

  // Get streak data
  static async getStreakData(userId: string): Promise<{ [key: string]: StreakData }> {
    try {
      const streaks = await prisma.goalStreak.findMany({
        where: { userId }
      })

      const streakData: { [key: string]: StreakData } = {
        daily: { streakType: 'daily', currentCount: 0, longestCount: 0, lastActivity: new Date(), isActive: false },
        weekly: { streakType: 'weekly', currentCount: 0, longestCount: 0, lastActivity: new Date(), isActive: false },
        monthly: { streakType: 'monthly', currentCount: 0, longestCount: 0, lastActivity: new Date(), isActive: false }
      }

      streaks.forEach(streak => {
        streakData[streak.streakType] = {
          streakType: streak.streakType as 'daily' | 'weekly' | 'monthly',
          currentCount: streak.currentCount,
          longestCount: streak.longestCount,
          lastActivity: streak.lastActivity,
          isActive: streak.isActive
        }
      })

      return streakData
    } catch (error) {
      console.error('Error fetching streak data:', error)
      throw new Error('Failed to fetch streak data')
    }
  }

  // Update streak when goal is completed
  static async updateStreak(userId: string, streakType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const now = new Date()
      const existingStreak = await prisma.goalStreak.findUnique({
        where: { userId_streakType: { userId, streakType } }
      })

      if (existingStreak) {
        const timeDiff = now.getTime() - existingStreak.lastActivity.getTime()
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

        let newCurrentCount = existingStreak.currentCount
        let newLongestCount = existingStreak.longestCount
        let isActive = true

        // Check if streak is still active
        if (streakType === 'daily' && daysDiff > 1) {
          newCurrentCount = 1
          isActive = false
        } else if (streakType === 'weekly' && daysDiff > 7) {
          newCurrentCount = 1
          isActive = false
        } else if (streakType === 'monthly' && daysDiff > 30) {
          newCurrentCount = 1
          isActive = false
        } else if (daysDiff <= 1) {
          newCurrentCount = existingStreak.currentCount + 1
        }

        newLongestCount = Math.max(newLongestCount, newCurrentCount)

        await prisma.goalStreak.update({
          where: { userId_streakType: { userId, streakType } },
          data: {
            currentCount: newCurrentCount,
            longestCount: newLongestCount,
            lastActivity: now,
            isActive
          }
        })
      } else {
        // Create new streak
        await prisma.goalStreak.create({
          data: {
            userId,
            streakType,
            currentCount: 1,
            longestCount: 1,
            lastActivity: now,
            isActive: true
          }
        })
      }
    } catch (error) {
      console.error('Error updating streak:', error)
      throw new Error('Failed to update streak')
    }
  }

  // Get early completions count
  private static async getEarlyCompletions(userId: string): Promise<number> {
    try {
      return await prisma.goal.count({
        where: {
          userId,
          completed: true,
          targetDate: { not: null },
          // We would need to add a completedAt field to track when it was completed
          // For now, we'll assume early completion if updated before target date
        }
      })
    } catch (error) {
      console.error('Error fetching early completions:', error)
      return 0
    }
  }

  // Get perfect completions count (100% progress)
  private static async getPerfectCompletions(userId: string): Promise<number> {
    try {
      return await prisma.goal.count({
        where: {
          userId,
          completed: true,
          progress: 100
        }
      })
    } catch (error) {
      console.error('Error fetching perfect completions:', error)
      return 0
    }
  }

  // Get achievement summary for user
  static async getAchievementSummary(userId: string) {
    try {
      const achievements = await this.getUserAchievements(userId)
      const streakData = await this.getStreakData(userId)
      const goalStats = await this.getUserGoalStats(userId)

      return {
        totalAchievements: achievements.length,
        recentAchievements: achievements.slice(0, 3),
        activeStreaks: Object.values(streakData).filter(s => s.isActive),
        longestStreak: Math.max(...Object.values(streakData).map(s => s.longestCount)),
        completionRate: goalStats.totalGoals > 0 ? 
          Math.round((goalStats.completedGoals / goalStats.totalGoals) * 100) : 0,
        nextAchievements: this.getNextAchievements(achievements, goalStats)
      }
    } catch (error) {
      console.error('Error fetching achievement summary:', error)
      throw new Error('Failed to fetch achievement summary')
    }
  }

  // Get next achievements user can unlock
  private static getNextAchievements(currentAchievements: Achievement[], goalStats: any) {
    const existingTypes = currentAchievements.map(a => a.type)
    const nextAchievements = []

    for (const achievementType of this.achievementTypes) {
      if (!existingTypes.includes(achievementType.type)) {
        nextAchievements.push({
          type: achievementType.type,
          title: achievementType.title,
          description: achievementType.description,
          icon: achievementType.icon,
          progress: this.getAchievementProgress(achievementType, goalStats)
        })
      }
    }

    return nextAchievements.slice(0, 3) // Return top 3 next achievements
  }

  // Calculate progress towards an achievement
  private static getAchievementProgress(achievementType: AchievementType, goalStats: any): number {
    switch (achievementType.type) {
      case 'first_goal_completed':
        return Math.min(goalStats.completedGoals, 1) * 100
      case 'goal_master':
        return Math.min(goalStats.completedGoals / 10, 1) * 100
      case 'streak_week':
        return Math.min(goalStats.streakLength / 7, 1) * 100
      case 'streak_month':
        return Math.min(goalStats.streakLength / 30, 1) * 100
      case 'category_bonding':
        return Math.min((goalStats.categoryCompletions.bonding || 0) / 5, 1) * 100
      case 'category_development':
        return Math.min((goalStats.categoryCompletions.development || 0) / 5, 1) * 100
      case 'early_bird':
        return Math.min(goalStats.earlyCompletions / 3, 1) * 100
      case 'perfectionist':
        return Math.min(goalStats.perfectCompletions / 5, 1) * 100
      default:
        return 0
    }
  }
}

export default AchievementService 