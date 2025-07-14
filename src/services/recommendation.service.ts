import { prisma } from '@/lib/prisma'
import { CreateGoalData } from './goal.service'

export interface GoalRecommendation {
  id: string
  title: string
  description: string
  category: 'bonding' | 'development' | 'personal_growth' | 'relationship'
  priority: 'low' | 'medium' | 'high'
  estimatedDuration: number // in days
  difficulty: 'easy' | 'medium' | 'hard'
  targetAge?: string
  tags: string[]
  reason: string
  seasonalRelevance?: string
  completionRate: number // historical success rate
  nextGoals?: string[] // IDs of goals that naturally follow
}

export interface RecommendationContext {
  userId: string
  childrenAges: number[]
  currentGoals: any[]
  completedGoals: any[]
  preferences: any
  season: string
  recentActivity: string[]
  strugglingCategories: string[]
  successfulCategories: string[]
}

export interface SmartRecommendationFilters {
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  maxDuration?: number
  targetAge?: string
  excludeCompleted?: boolean
  prioritizeStrengths?: boolean
  addressWeaknesses?: boolean
  seasonal?: boolean
}

export class RecommendationService {
  // Get personalized goal recommendations
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    filters?: SmartRecommendationFilters
  ): Promise<GoalRecommendation[]> {
    try {
      const context = await this.buildRecommendationContext(userId)
      const baseRecommendations = await this.getBaseRecommendations()
      
      // Filter and score recommendations
      const scoredRecommendations = await this.scoreRecommendations(
        baseRecommendations,
        context,
        filters
      )

      // Sort by score and apply filters
      const filteredRecommendations = this.applyFilters(scoredRecommendations, filters)
      
      return filteredRecommendations
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      throw new Error('Failed to get recommendations')
    }
  }

  // Get goal suggestions based on chat context
  static async getChatBasedRecommendations(
    userId: string,
    chatContext: string,
    limit: number = 5
  ): Promise<GoalRecommendation[]> {
    try {
      const context = await this.buildRecommendationContext(userId)
      const baseRecommendations = await this.getBaseRecommendations()
      
      // Analyze chat context for relevant themes
      const themes = this.extractThemesFromChat(chatContext)
      
      // Filter recommendations based on chat themes
      const contextualRecommendations = baseRecommendations.filter(rec => {
        return themes.some(theme => 
          rec.title.toLowerCase().includes(theme) ||
          rec.description.toLowerCase().includes(theme) ||
          rec.tags.some(tag => tag.toLowerCase().includes(theme))
        )
      })

      // Score based on context relevance
      const scoredRecommendations = await this.scoreRecommendations(
        contextualRecommendations,
        context
      )

      return scoredRecommendations
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting chat-based recommendations:', error)
      throw new Error('Failed to get chat-based recommendations')
    }
  }

  // Get goal sequencing recommendations
  static async getNextGoalRecommendations(
    userId: string,
    completedGoalId: string,
    limit: number = 3
  ): Promise<GoalRecommendation[]> {
    try {
      const completedGoal = await prisma.goal.findUnique({
        where: { id: completedGoalId }
      })

      if (!completedGoal) {
        throw new Error('Completed goal not found')
      }

      const context = await this.buildRecommendationContext(userId)
      const baseRecommendations = await this.getBaseRecommendations()
      
      // Find goals that naturally follow the completed goal
      const nextGoals = baseRecommendations.filter(rec => {
        return rec.category === completedGoal.category ||
               rec.tags.some(tag => tag.toLowerCase().includes(completedGoal.category?.toLowerCase() || ''))
      })

      // Score based on natural progression
      const scoredRecommendations = await this.scoreRecommendations(
        nextGoals,
        context
      )

      return scoredRecommendations
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting next goal recommendations:', error)
      throw new Error('Failed to get next goal recommendations')
    }
  }

  // Get seasonal recommendations
  static async getSeasonalRecommendations(
    userId: string,
    season: string,
    limit: number = 5
  ): Promise<GoalRecommendation[]> {
    try {
      const context = await this.buildRecommendationContext(userId)
      const baseRecommendations = await this.getBaseRecommendations()
      
      // Filter for seasonal relevance
      const seasonalRecommendations = baseRecommendations.filter(rec => 
        rec.seasonalRelevance?.toLowerCase().includes(season.toLowerCase())
      )

      const scoredRecommendations = await this.scoreRecommendations(
        seasonalRecommendations,
        context
      )

      return scoredRecommendations
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting seasonal recommendations:', error)
      throw new Error('Failed to get seasonal recommendations')
    }
  }

  // Get recommendations for struggling areas
  static async getImprovementRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<GoalRecommendation[]> {
    try {
      const context = await this.buildRecommendationContext(userId)
      const baseRecommendations = await this.getBaseRecommendations()
      
      // Focus on struggling categories
      const improvementRecommendations = baseRecommendations.filter(rec =>
        context.strugglingCategories.includes(rec.category)
      )

      // Prioritize easier goals for struggling areas
      const easierGoals = improvementRecommendations.filter(rec => 
        rec.difficulty === 'easy' || rec.difficulty === 'medium'
      )

      const scoredRecommendations = await this.scoreRecommendations(
        easierGoals,
        context
      )

      return scoredRecommendations
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting improvement recommendations:', error)
      throw new Error('Failed to get improvement recommendations')
    }
  }

  // Build recommendation context from user data
  private static async buildRecommendationContext(userId: string): Promise<RecommendationContext> {
    try {
      const [user, currentGoals, completedGoals, analytics] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: { fatherProfile: true }
        }),
        prisma.goal.findMany({
          where: { userId, completed: false }
        }),
        prisma.goal.findMany({
          where: { userId, completed: true }
        }),
        prisma.goalAnalytics.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
      ])

      if (!user) {
        throw new Error('User not found')
      }

      const childrenAges = user.fatherProfile?.childrenAges || []
      const preferences = user.fatherProfile?.preferences || {}
      const season = this.getCurrentSeason()
      
      // Analyze recent activity
      const recentActivity = analytics.map(a => a.eventType)
      
      // Identify struggling and successful categories
      const strugglingCategories = await this.identifyStrugglingCategories(userId)
      const successfulCategories = await this.identifySuccessfulCategories(userId)

      return {
        userId,
        childrenAges,
        currentGoals,
        completedGoals,
        preferences,
        season,
        recentActivity,
        strugglingCategories,
        successfulCategories
      }
    } catch (error) {
      console.error('Error building recommendation context:', error)
      throw new Error('Failed to build recommendation context')
    }
  }

  // Get base recommendations database
  private static async getBaseRecommendations(): Promise<GoalRecommendation[]> {
    // This would ideally come from a database or external service
    // For now, we'll return a comprehensive set of father-focused recommendations
    return [
      {
        id: 'daily-one-on-one',
        title: 'Daily One-on-One Time',
        description: 'Spend 15 minutes of focused, uninterrupted time with each child daily',
        category: 'bonding',
        priority: 'high',
        estimatedDuration: 7,
        difficulty: 'easy',
        targetAge: '0-18',
        tags: ['quality time', 'bonding', 'connection', 'daily routine'],
        reason: 'Consistent one-on-one time strengthens the father-child bond',
        seasonalRelevance: 'all seasons',
        completionRate: 85,
        nextGoals: ['active-listening', 'bedtime-routine']
      },
      {
        id: 'bedtime-routine',
        title: 'Establish Bedtime Routine',
        description: 'Create a consistent bedtime routine that includes reading and bonding',
        category: 'bonding',
        priority: 'high',
        estimatedDuration: 14,
        difficulty: 'medium',
        targetAge: '0-12',
        tags: ['routine', 'sleep', 'reading', 'consistency'],
        reason: 'Bedtime routines provide security and bonding opportunities',
        seasonalRelevance: 'fall winter',
        completionRate: 78,
        nextGoals: ['storytelling-skills', 'emotional-check-ins']
      },
      {
        id: 'outdoor-adventures',
        title: 'Weekly Outdoor Adventures',
        description: 'Plan and execute weekly outdoor activities to promote physical activity and exploration',
        category: 'development',
        priority: 'medium',
        estimatedDuration: 21,
        difficulty: 'medium',
        targetAge: '3-18',
        tags: ['outdoor', 'physical activity', 'exploration', 'adventure'],
        reason: 'Outdoor activities promote physical and mental development',
        seasonalRelevance: 'spring summer',
        completionRate: 82,
        nextGoals: ['nature-education', 'physical-challenges']
      },
      {
        id: 'emotional-check-ins',
        title: 'Daily Emotional Check-ins',
        description: 'Ask about feelings and emotions during conversations with your child',
        category: 'development',
        priority: 'high',
        estimatedDuration: 10,
        difficulty: 'medium',
        targetAge: '3-18',
        tags: ['emotions', 'communication', 'mental health', 'feelings'],
        reason: 'Regular emotional check-ins build emotional intelligence',
        seasonalRelevance: 'all seasons',
        completionRate: 75,
        nextGoals: ['active-listening', 'conflict-resolution']
      },
      {
        id: 'active-listening',
        title: 'Practice Active Listening',
        description: 'Focus on truly hearing and understanding your child without rushing to solve problems',
        category: 'relationship',
        priority: 'high',
        estimatedDuration: 14,
        difficulty: 'hard',
        targetAge: '5-18',
        tags: ['listening', 'communication', 'understanding', 'patience'],
        reason: 'Active listening builds trust and stronger relationships',
        seasonalRelevance: 'all seasons',
        completionRate: 68,
        nextGoals: ['conflict-resolution', 'empathy-building']
      },
      {
        id: 'work-life-balance',
        title: 'Improve Work-Life Balance',
        description: 'Set boundaries between work and family time to be more present',
        category: 'personal_growth',
        priority: 'high',
        estimatedDuration: 30,
        difficulty: 'hard',
        targetAge: '0-18',
        tags: ['balance', 'boundaries', 'presence', 'time management'],
        reason: 'Better work-life balance leads to more quality family time',
        seasonalRelevance: 'all seasons',
        completionRate: 72,
        nextGoals: ['stress-management', 'time-blocking']
      },
      {
        id: 'cooking-together',
        title: 'Cook Together Weekly',
        description: 'Involve your child in meal preparation and cooking activities',
        category: 'bonding',
        priority: 'medium',
        estimatedDuration: 21,
        difficulty: 'easy',
        targetAge: '3-18',
        tags: ['cooking', 'life skills', 'teamwork', 'creativity'],
        reason: 'Cooking together builds life skills and creates bonding moments',
        seasonalRelevance: 'all seasons',
        completionRate: 88,
        nextGoals: ['nutrition-education', 'meal-planning']
      },
      {
        id: 'praise-and-encouragement',
        title: 'Daily Praise and Encouragement',
        description: 'Provide specific, meaningful praise for effort and character, not just achievements',
        category: 'development',
        priority: 'high',
        estimatedDuration: 7,
        difficulty: 'medium',
        targetAge: '2-18',
        tags: ['praise', 'encouragement', 'self-esteem', 'positivity'],
        reason: 'Specific praise builds confidence and motivation',
        seasonalRelevance: 'all seasons',
        completionRate: 90,
        nextGoals: ['growth-mindset', 'character-building']
      },
      {
        id: 'limits-and-boundaries',
        title: 'Set Clear Limits and Boundaries',
        description: 'Establish and consistently enforce age-appropriate rules and expectations',
        category: 'development',
        priority: 'high',
        estimatedDuration: 21,
        difficulty: 'hard',
        targetAge: '2-18',
        tags: ['discipline', 'boundaries', 'consistency', 'structure'],
        reason: 'Clear boundaries provide security and teach self-regulation',
        seasonalRelevance: 'all seasons',
        completionRate: 65,
        nextGoals: ['positive-discipline', 'natural-consequences']
      },
      {
        id: 'family-traditions',
        title: 'Create Family Traditions',
        description: 'Establish meaningful family traditions that create lasting memories',
        category: 'bonding',
        priority: 'medium',
        estimatedDuration: 30,
        difficulty: 'medium',
        targetAge: '0-18',
        tags: ['traditions', 'memories', 'family culture', 'rituals'],
        reason: 'Family traditions create belonging and lasting memories',
        seasonalRelevance: 'all seasons',
        completionRate: 80,
        nextGoals: ['holiday-planning', 'memory-keeping']
      },
      {
        id: 'stress-management',
        title: 'Develop Stress Management Skills',
        description: 'Learn and practice techniques to manage parenting stress effectively',
        category: 'personal_growth',
        priority: 'high',
        estimatedDuration: 28,
        difficulty: 'medium',
        targetAge: '0-18',
        tags: ['stress', 'self-care', 'mindfulness', 'coping'],
        reason: 'Managing stress improves parenting effectiveness',
        seasonalRelevance: 'all seasons',
        completionRate: 73,
        nextGoals: ['mindfulness-practice', 'self-care-routine']
      },
      {
        id: 'reading-together',
        title: 'Daily Reading Time',
        description: 'Read together for at least 20 minutes daily, taking turns or reading aloud',
        category: 'development',
        priority: 'high',
        estimatedDuration: 14,
        difficulty: 'easy',
        targetAge: '0-16',
        tags: ['reading', 'literacy', 'bonding', 'learning'],
        reason: 'Reading together builds literacy and creates bonding moments',
        seasonalRelevance: 'all seasons',
        completionRate: 85,
        nextGoals: ['storytelling-skills', 'library-visits']
      }
    ]
  }

  // Score recommendations based on context
  private static async scoreRecommendations(
    recommendations: GoalRecommendation[],
    context: RecommendationContext,
    filters?: SmartRecommendationFilters
  ): Promise<GoalRecommendation[]> {
    return recommendations.map(rec => {
      let score = rec.completionRate

      // Age relevance scoring
      if (rec.targetAge && context.childrenAges.length > 0) {
        const isAgeRelevant = this.isAgeRelevant(rec.targetAge, context.childrenAges)
        score += isAgeRelevant ? 10 : -20
      }

      // Category preference scoring
      if (filters?.addressWeaknesses && context.strugglingCategories.includes(rec.category)) {
        score += 15
      }
      if (filters?.prioritizeStrengths && context.successfulCategories.includes(rec.category)) {
        score += 10
      }

      // Avoid recommending similar goals
      const similarCompleted = context.completedGoals.some(goal => 
        goal.title.toLowerCase().includes(rec.title.toLowerCase().split(' ')[0])
      )
      const similarActive = context.currentGoals.some(goal => 
        goal.title.toLowerCase().includes(rec.title.toLowerCase().split(' ')[0])
      )

      if (similarCompleted) score -= 30
      if (similarActive) score -= 50

      // Seasonal relevance
      if (rec.seasonalRelevance?.includes(context.season)) {
        score += 5
      }

      // Difficulty adjustment based on recent performance
      const recentFailures = context.recentActivity.filter(a => a === 'deadline_missed').length
      if (recentFailures > 2 && rec.difficulty === 'hard') {
        score -= 10
      }

      return { ...rec, completionRate: Math.max(0, score) }
    })
  }

  // Apply filters to recommendations
  private static applyFilters(
    recommendations: GoalRecommendation[],
    filters?: SmartRecommendationFilters
  ): GoalRecommendation[] {
    let filtered = recommendations

    if (filters?.category) {
      filtered = filtered.filter(rec => rec.category === filters.category)
    }

    if (filters?.difficulty) {
      filtered = filtered.filter(rec => rec.difficulty === filters.difficulty)
    }

    if (filters?.maxDuration) {
      filtered = filtered.filter(rec => rec.estimatedDuration <= filters.maxDuration)
    }

    if (filters?.targetAge) {
      filtered = filtered.filter(rec => rec.targetAge?.includes(filters.targetAge!))
    }

    return filtered
  }

  // Extract themes from chat context
  private static extractThemesFromChat(chatContext: string): string[] {
    const themes: string[] = []
    const lowerContext = chatContext.toLowerCase()

    // Define theme keywords
    const themeKeywords = {
      bonding: ['bond', 'connect', 'relationship', 'close', 'together'],
      development: ['learn', 'grow', 'develop', 'skill', 'milestone'],
      discipline: ['behavior', 'discipline', 'rules', 'boundaries', 'limits'],
      communication: ['talk', 'listen', 'communicate', 'understand', 'conversation'],
      emotions: ['feel', 'emotion', 'angry', 'sad', 'happy', 'frustrated'],
      sleep: ['sleep', 'bedtime', 'tired', 'nap', 'rest'],
      eating: ['eat', 'food', 'meal', 'hungry', 'nutrition'],
      school: ['school', 'homework', 'teacher', 'grades', 'education'],
      outdoor: ['outside', 'park', 'nature', 'exercise', 'sports'],
      creative: ['art', 'creative', 'imagination', 'play', 'games']
    }

    // Extract themes based on keywords
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerContext.includes(keyword))) {
        themes.push(theme)
      }
    }

    return themes
  }

  // Check if recommendation is age-relevant
  private static isAgeRelevant(targetAge: string, childrenAges: number[]): boolean {
    if (targetAge === '0-18') return true

    const [minAge, maxAge] = targetAge.split('-').map(Number)
    return childrenAges.some(age => age >= minAge && age <= maxAge)
  }

  // Get current season
  private static getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  // Identify struggling categories
  private static async identifyStrugglingCategories(userId: string): Promise<string[]> {
    const categories = ['bonding', 'development', 'personal_growth', 'relationship']
    const struggling: string[] = []

    for (const category of categories) {
      const [total, completed] = await Promise.all([
        prisma.goal.count({ where: { userId, category } }),
        prisma.goal.count({ where: { userId, category, completed: true } })
      ])

      const completionRate = total > 0 ? (completed / total) * 100 : 0
      if (completionRate < 50 && total > 0) {
        struggling.push(category)
      }
    }

    return struggling
  }

  // Identify successful categories
  private static async identifySuccessfulCategories(userId: string): Promise<string[]> {
    const categories = ['bonding', 'development', 'personal_growth', 'relationship']
    const successful: string[] = []

    for (const category of categories) {
      const [total, completed] = await Promise.all([
        prisma.goal.count({ where: { userId, category } }),
        prisma.goal.count({ where: { userId, category, completed: true } })
      ])

      const completionRate = total > 0 ? (completed / total) * 100 : 0
      if (completionRate >= 75 && total > 0) {
        successful.push(category)
      }
    }

    return successful
  }

  // Convert recommendation to CreateGoalData
  static recommendationToGoalData(recommendation: GoalRecommendation): CreateGoalData {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + recommendation.estimatedDuration)

    return {
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      priority: recommendation.priority,
      targetDate,
      progress: 0
    }
  }
}

export default RecommendationService 