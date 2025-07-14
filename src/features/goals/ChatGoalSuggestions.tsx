'use client'

import { useState } from 'react'
import { Target, Lightbulb, Plus, X, ArrowRight } from 'lucide-react'
import GoalSuggestions from './GoalSuggestions'
import { CreateGoalData } from '@/services/goal.service'

interface ChatGoalSuggestionsProps {
  threadId: string
  onCreateGoal: (data: CreateGoalData) => void
  className?: string
}

export default function ChatGoalSuggestions({ 
  threadId, 
  onCreateGoal, 
  className = '' 
}: ChatGoalSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [createdGoalsCount, setCreatedGoalsCount] = useState(0)

  const handleCreateGoal = async (data: CreateGoalData) => {
    try {
      await onCreateGoal(data)
      setCreatedGoalsCount(prev => prev + 1)
      
      // Show success feedback
      setTimeout(() => {
        setCreatedGoalsCount(prev => prev > 0 ? prev - 1 : 0)
      }, 3000)
    } catch (error) {
      console.error('Error creating goal from chat:', error)
    }
  }

  if (!isExpanded) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg hover:from-primary/15 hover:to-primary/10 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-primary/20 rounded-full mr-3">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Turn this conversation into goals
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Get AI-powered goal suggestions based on your discussion
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {createdGoalsCount > 0 && (
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                  {createdGoalsCount} created
                </div>
              )}
              <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Quick hint */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          💡 Transform insights into actionable fatherhood goals
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="bg-card border border-border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-foreground">
              Goals from this conversation
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Based on your conversation, here are some personalized goal suggestions to help you take action on the topics you've discussed.
            </p>
          </div>

          <GoalSuggestions
            threadId={threadId}
            onCreateGoal={handleCreateGoal}
            className="border-0 shadow-none p-0 bg-transparent"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Goal suggestions are powered by AI and based on your chat context</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 