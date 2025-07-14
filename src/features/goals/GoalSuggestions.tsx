'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { CreateGoalData } from '@/services/goal.service'

interface GoalSuggestion {
  title: string
  description?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

interface GoalSuggestionsProps {
  threadId?: string
  onCreateGoal: (data: CreateGoalData) => void
  className?: string
}

export default function GoalSuggestions({ 
  threadId, 
  onCreateGoal, 
  className = '' 
}: GoalSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryColors = {
    bonding: 'bg-red-100 text-red-800',
    development: 'bg-green-100 text-green-800',
    personal_growth: 'bg-purple-100 text-purple-800',
    relationship: 'bg-blue-100 text-blue-800',
  }

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  }

  const priorityIcons = {
    low: '⚪',
    medium: '🟡',
    high: '🔴',
  }

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const url = threadId 
        ? `/api/goals/suggestions?threadId=${threadId}`
        : '/api/goals/suggestions'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error('Error fetching goal suggestions:', err)
      setError('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [threadId])

  const handleCreateGoal = async (suggestion: GoalSuggestion) => {
    try {
      const goalData: CreateGoalData = {
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        priority: suggestion.priority || 'medium',
        progress: 0,
      }

      await onCreateGoal(goalData)
      
      // Remove the suggestion from the list after creating
      setSuggestions(prev => prev.filter(s => s.title !== suggestion.title))
    } catch (error) {
      console.error('Error creating goal from suggestion:', error)
    }
  }

  if (loading && suggestions.length === 0) {
    return (
      <div className={`dadbase-card ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
            Loading suggestions...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`dadbase-card ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchSuggestions}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0 && !loading) {
    return (
      <div className={`dadbase-card ${className}`}>
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No suggestions available
          </h3>
          <p className="text-muted-foreground mb-4">
            Complete your profile or chat with the AI to get personalized goal suggestions.
          </p>
          <button
            onClick={fetchSuggestions}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`dadbase-card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold text-foreground">
            Suggested Goals
          </h3>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          title="Refresh suggestions"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">
                  {suggestion.title}
                </h4>
                
                {suggestion.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs">
                  {/* Category */}
                  {suggestion.category && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[suggestion.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
                      {suggestion.category.replace('_', ' ')}
                    </span>
                  )}

                  {/* Priority */}
                  {suggestion.priority && (
                    <span className={`flex items-center ${priorityColors[suggestion.priority as keyof typeof priorityColors]}`}>
                      {priorityIcons[suggestion.priority as keyof typeof priorityIcons]} {suggestion.priority}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleCreateGoal(suggestion)}
                className="ml-4 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                title="Create this goal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {threadId && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 These suggestions are based on your recent conversation. They're tailored to help you take action on the topics you've discussed.
          </p>
        </div>
      )}
    </div>
  )
} 