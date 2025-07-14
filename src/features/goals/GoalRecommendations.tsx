'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface Recommendation {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedDuration: string
  reasoning: string
  type: string
  tags: string[]
  relatedGoals?: string[]
}

interface RecommendationFilters {
  category?: string
  difficulty?: string
  priority?: string
  type?: string
}

const GoalRecommendations = () => {
  const { user } = useUser()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<RecommendationFilters>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchRecommendations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.category) queryParams.append('category', filters.category)
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty)
      if (filters.priority) queryParams.append('priority', filters.priority)
      if (filters.type) queryParams.append('type', filters.type)

      const response = await fetch(`/api/goals/recommendations?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (recommendation: Recommendation) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: recommendation.title,
          description: recommendation.description,
          category: recommendation.category,
          priority: recommendation.priority,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          isActive: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to create goal')
      
      // Refresh recommendations after creating a goal
      fetchRecommendations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [user, filters])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = ['all', 'health', 'development', 'bonding', 'learning', 'adventure', 'creativity', 'community', 'parenting', 'personal']
  const difficulties = ['easy', 'medium', 'hard']
  const priorities = ['high', 'medium', 'low']
  const types = ['personalized', 'chat_based', 'seasonal', 'improvement', 'completion', 'social', 'wellness', 'skill_building']

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading recommendations</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🎯 AI-Powered Goal Recommendations</h2>
        <p className="text-blue-100">Personalized suggestions to help you grow as a father</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-4">Filter Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value === 'all' ? undefined : e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category} className="text-gray-900 bg-white">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={filters.difficulty || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value === 'all' ? undefined : e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900 bg-white">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty} className="text-gray-900 bg-white">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value === 'all' ? undefined : e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900 bg-white">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority} className="text-gray-900 bg-white">
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value === 'all' ? undefined : e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900 bg-white">All Types</option>
              {types.map(type => (
                <option key={type} value={type} className="text-gray-900 bg-white">
                  {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{recommendation.description}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                {recommendation.difficulty.charAt(0).toUpperCase() + recommendation.difficulty.slice(1)}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {recommendation.category}
              </span>
            </div>

            {/* Reasoning */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 italic">"{recommendation.reasoning}"</p>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Estimated Duration:</span> {recommendation.estimatedDuration}
              </p>
            </div>

            {/* Tags */}
            {recommendation.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {recommendation.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => handleCreateGoal(recommendation)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Create Goal
            </button>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations available</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later for new suggestions.</p>
        </div>
      )}
    </div>
  )
}

export default GoalRecommendations 