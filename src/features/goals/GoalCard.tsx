'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Target, 
  Clock, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react'
import { GoalWithStats } from '@/services/goal.service'
import { formatDistanceToNow } from 'date-fns'

interface GoalCardProps {
  goal: GoalWithStats
  onEdit: (goal: GoalWithStats) => void
  onDelete: (goalId: string) => void
  onUpdateProgress: (goalId: string, progress: number) => void
  onToggleComplete: (goalId: string, completed: boolean) => void
}

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

export default function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onUpdateProgress, 
  onToggleComplete 
}: GoalCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  const getProgressBarColor = () => {
    if (goal.completed) return 'bg-green-500'
    if (goal.progress >= 75) return 'bg-green-400'
    if (goal.progress >= 50) return 'bg-yellow-400'
    if (goal.progress >= 25) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const formatTargetDate = (date: Date | null) => {
    if (!date) return null
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const handleProgressUpdate = async (newProgress: number) => {
    setIsUpdatingProgress(true)
    try {
      await onUpdateProgress(goal.id, newProgress)
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleToggleComplete = async () => {
    try {
      await onToggleComplete(goal.id, !goal.completed)
    } catch (error) {
      console.error('Error toggling goal completion:', error)
    }
  }

  return (
    <div className={`dadbase-card relative ${goal.completed ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className={`text-lg font-semibold ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {goal.title}
            </h3>
            {goal.completed && (
              <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
            )}
          </div>
          
          {goal.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {goal.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs">
            {/* Category */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[goal.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
              {goal.category?.replace('_', ' ')}
            </span>

            {/* Priority */}
            <span className={`flex items-center ${priorityColors[goal.priority as keyof typeof priorityColors]}`}>
              {priorityIcons[goal.priority as keyof typeof priorityIcons]} {goal.priority}
            </span>

            {/* Target Date */}
            {goal.targetDate && (
              <span className={`flex items-center ${goal.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3 mr-1" />
                {formatTargetDate(goal.targetDate)}
                {goal.isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
              </span>
            )}
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit(goal)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </button>
              <button
                onClick={handleToggleComplete}
                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button
                onClick={() => {
                  onDelete(goal.id)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center text-sm text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">{goal.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Quick Progress Update */}
      {!goal.completed && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Quick Update
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={goal.progress}
              onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
              disabled={isUpdatingProgress}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            {isUpdatingProgress && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Created {formatDistanceToNow(goal.createdAt, { addSuffix: true })}
        </div>
        
        {goal.daysUntilTarget && (
          <div className={`text-xs ${goal.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
            {goal.isOverdue ? 'Overdue' : `${goal.daysUntilTarget} days left`}
          </div>
        )}
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
} 