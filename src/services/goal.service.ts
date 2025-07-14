import { prisma } from '@/lib/prisma'

export interface CreateGoalData {
  title: string
  description?: string
  category?: string
  targetDate?: Date
  priority?: 'low' | 'medium' | 'high'
  progress?: number
}

export interface UpdateGoalData {
  title?: string
  description?: string
  category?: string
  targetDate?: Date
  priority?: 'low' | 'medium' | 'high'
  progress?: number
  completed?: boolean
}

export interface GoalFilters {
  category?: string
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
  targetDateFrom?: Date
  targetDateTo?: Date
}

export interface GoalWithStats {
  id: string
  title: string
  description: string | null
  category: string | null
  targetDate: Date | null
  completed: boolean
  progress: number
  priority: string
  createdAt: Date
  updatedAt: Date
  daysUntilTarget?: number
  isOverdue?: boolean
}

export class GoalService {
  // Create a new goal
  static async createGoal(userId: string, data: CreateGoalData) {
    try {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          category: data.category || 'personal_growth',
          targetDate: data.targetDate,
          priority: data.priority || 'medium',
          progress: data.progress || 0,
        },
      })
      
      return goal
    } catch (error) {
      console.error('Error creating goal:', error)
      throw new Error('Failed to create goal')
    }
  }

  // Get all goals for a user
  static async getUserGoals(userId: string, filters?: GoalFilters): Promise<GoalWithStats[]> {
    try {
      const where: any = {
        userId,
      }

      // Apply filters
      if (filters?.category) {
        where.category = filters.category
      }
      if (filters?.priority) {
        where.priority = filters.priority
      }
      if (filters?.completed !== undefined) {
        where.completed = filters.completed
      }
      if (filters?.targetDateFrom || filters?.targetDateTo) {
        where.targetDate = {}
        if (filters.targetDateFrom) {
          where.targetDate.gte = filters.targetDateFrom
        }
        if (filters.targetDateTo) {
          where.targetDate.lte = filters.targetDateTo
        }
      }

      const goals = await prisma.goal.findMany({
        where,
        orderBy: [
          { completed: 'asc' },
          { priority: 'desc' },
          { targetDate: 'asc' },
          { createdAt: 'desc' },
        ],
      })

      // Add computed fields
      return goals.map(goal => this.addGoalStats(goal))
    } catch (error) {
      console.error('Error fetching user goals:', error)
      throw new Error('Failed to fetch goals')
    }
  }

  // Get a single goal by ID
  static async getGoalById(userId: string, goalId: string): Promise<GoalWithStats | null> {
    try {
      const goal = await prisma.goal.findFirst({
        where: {
          id: goalId,
          userId,
        },
      })

      if (!goal) return null

      return this.addGoalStats(goal)
    } catch (error) {
      console.error('Error fetching goal:', error)
      throw new Error('Failed to fetch goal')
    }
  }

  // Update a goal
  static async updateGoal(userId: string, goalId: string, data: UpdateGoalData) {
    try {
      const goal = await prisma.goal.updateMany({
        where: {
          id: goalId,
          userId,
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })

      if (goal.count === 0) {
        throw new Error('Goal not found')
      }

      // Return the updated goal
      return this.getGoalById(userId, goalId)
    } catch (error) {
      console.error('Error updating goal:', error)
      throw new Error('Failed to update goal')
    }
  }

  // Delete a goal
  static async deleteGoal(userId: string, goalId: string) {
    try {
      const goal = await prisma.goal.deleteMany({
        where: {
          id: goalId,
          userId,
        },
      })

      if (goal.count === 0) {
        throw new Error('Goal not found')
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw new Error('Failed to delete goal')
    }
  }

  // Update goal progress
  static async updateGoalProgress(userId: string, goalId: string, progress: number) {
    try {
      const completed = progress >= 100
      
      const goal = await prisma.goal.updateMany({
        where: {
          id: goalId,
          userId,
        },
        data: {
          progress,
          completed,
          updatedAt: new Date(),
        },
      })

      if (goal.count === 0) {
        throw new Error('Goal not found')
      }

      return this.getGoalById(userId, goalId)
    } catch (error) {
      console.error('Error updating goal progress:', error)
      throw new Error('Failed to update goal progress')
    }
  }

  // Get goal statistics
  static async getGoalStats(userId: string) {
    try {
      const [totalGoals, completedGoals, activeGoals, overdueGoals] = await Promise.all([
        prisma.goal.count({
          where: { userId },
        }),
        prisma.goal.count({
          where: { userId, completed: true },
        }),
        prisma.goal.count({
          where: { userId, completed: false },
        }),
        prisma.goal.count({
          where: {
            userId,
            completed: false,
            targetDate: {
              lt: new Date(),
            },
          },
        }),
      ])

      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

      return {
        totalGoals,
        completedGoals,
        activeGoals,
        overdueGoals,
        completionRate,
      }
    } catch (error) {
      console.error('Error fetching goal stats:', error)
      throw new Error('Failed to fetch goal statistics')
    }
  }

  // Get goals by category
  static async getGoalsByCategory(userId: string) {
    try {
      const goals = await prisma.goal.findMany({
        where: { userId },
        select: {
          category: true,
          completed: true,
          progress: true,
        },
      })

      const categoryStats = goals.reduce((acc, goal) => {
        const category = goal.category || 'uncategorized'
        if (!acc[category]) {
          acc[category] = {
            total: 0,
            completed: 0,
            avgProgress: 0,
          }
        }
        acc[category].total += 1
        if (goal.completed) {
          acc[category].completed += 1
        }
        acc[category].avgProgress += goal.progress
        return acc
      }, {} as Record<string, { total: number; completed: number; avgProgress: number }>)

      // Calculate average progress for each category
      Object.keys(categoryStats).forEach(category => {
        categoryStats[category].avgProgress = Math.round(
          categoryStats[category].avgProgress / categoryStats[category].total
        )
      })

      return categoryStats
    } catch (error) {
      console.error('Error fetching goals by category:', error)
      throw new Error('Failed to fetch goals by category')
    }
  }

  // Suggest goals based on user profile and chat history
  static async suggestGoals(userId: string, chatContext?: string) {
    try {
      // Get user profile for context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { fatherProfile: true },
      })

      if (!user || !user.fatherProfile) {
        return this.getDefaultGoalSuggestions()
      }

      const profile = user.fatherProfile
      const suggestions: CreateGoalData[] = []

      // Goal suggestions based on children's ages
      if (profile.childrenAges && profile.childrenAges.length > 0) {
        const ages = profile.childrenAges
        
        // Newborn/infant goals (0-12 months)
        if (ages.some(age => age >= 0 && age <= 1)) {
          suggestions.push({
            title: 'Establish daily bonding routine with baby',
            description: 'Create consistent moments for skin-to-skin contact and interaction',
            category: 'bonding',
            priority: 'high',
          })
        }

        // Toddler goals (1-3 years)
        if (ages.some(age => age >= 1 && age <= 3)) {
          suggestions.push({
            title: 'Master positive discipline techniques',
            description: 'Learn and implement age-appropriate discipline strategies',
            category: 'development',
            priority: 'medium',
          })
        }

        // School-age goals (4-12 years)
        if (ages.some(age => age >= 4 && age <= 12)) {
          suggestions.push({
            title: 'Support child\'s independence development',
            description: 'Encourage age-appropriate independence while maintaining connection',
            category: 'development',
            priority: 'medium',
          })
        }
      }

      // Goals based on primary concerns
      if (profile.primaryConcerns && profile.primaryConcerns.length > 0) {
        profile.primaryConcerns.forEach(concern => {
          if (concern.includes('stress') || concern.includes('anxiety')) {
            suggestions.push({
              title: 'Develop stress management strategies',
              description: 'Learn healthy coping mechanisms for parenting challenges',
              category: 'personal_growth',
              priority: 'high',
            })
          }
          if (concern.includes('balance') || concern.includes('work')) {
            suggestions.push({
              title: 'Create better work-life balance',
              description: 'Establish boundaries and routines that prioritize family time',
              category: 'personal_growth',
              priority: 'medium',
            })
          }
        })
      }

      // Goals based on fathering goals
      if (profile.fatheringGoals && profile.fatheringGoals.length > 0) {
        profile.fatheringGoals.forEach(goal => {
          if (goal.includes('communication')) {
            suggestions.push({
              title: 'Improve father-child communication',
              description: 'Practice active listening and age-appropriate conversation skills',
              category: 'bonding',
              priority: 'medium',
            })
          }
          if (goal.includes('confidence')) {
            suggestions.push({
              title: 'Build parenting confidence',
              description: 'Learn child development basics and trust your instincts',
              category: 'personal_growth',
              priority: 'medium',
            })
          }
        })
      }

      // Remove duplicates and limit to 5 suggestions
      const uniqueSuggestions = suggestions.filter(
        (suggestion, index, self) => 
          index === self.findIndex(s => s.title === suggestion.title)
      ).slice(0, 5)

      return uniqueSuggestions
    } catch (error) {
      console.error('Error suggesting goals:', error)
      return this.getDefaultGoalSuggestions()
    }
  }

  // Get default goal suggestions
  private static getDefaultGoalSuggestions(): CreateGoalData[] {
    return [
      {
        title: 'Spend quality one-on-one time with each child',
        description: 'Dedicate 15-30 minutes daily to individual attention',
        category: 'bonding',
        priority: 'high',
      },
      {
        title: 'Learn about child development milestones',
        description: 'Understand what to expect at each stage of development',
        category: 'development',
        priority: 'medium',
      },
      {
        title: 'Practice mindful parenting techniques',
        description: 'Stay present and emotionally regulated during challenging moments',
        category: 'personal_growth',
        priority: 'medium',
      },
      {
        title: 'Establish consistent bedtime routines',
        description: 'Create calming, predictable evening routines for better sleep',
        category: 'development',
        priority: 'medium',
      },
      {
        title: 'Connect with other fathers',
        description: 'Build a support network of fellow dads for advice and friendship',
        category: 'relationship',
        priority: 'low',
      },
    ]
  }

  // Helper method to add computed stats to goals
  private static addGoalStats(goal: any): GoalWithStats {
    const now = new Date()
    let daysUntilTarget: number | undefined
    let isOverdue = false

    if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate)
      daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      isOverdue = daysUntilTarget < 0 && !goal.completed
    }

    return {
      ...goal,
      daysUntilTarget,
      isOverdue,
    }
  }
}

export default GoalService 