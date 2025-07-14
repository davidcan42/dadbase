'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  TrendingUp, 
  Target, 
  Plus, 
  Filter, 
  Calendar, 
  Trophy,
  BarChart3,
  PieChart,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import GoalForm from '@/features/goals/GoalForm'
import GoalCard from '@/features/goals/GoalCard'
import GoalSuggestions from '@/features/goals/GoalSuggestions'
import GoalProgressCharts from '@/features/goals/GoalProgressCharts'
import { GoalWithStats, CreateGoalData } from '@/services/goal.service'

interface GoalStats {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  overdueGoals: number
  completionRate: number
}

interface CategoryStats {
  [key: string]: {
    total: number
    completed: number
    avgProgress: number
  }
}

export default function ProgressPage() {
  const { user, isLoaded } = useUser()
  const [goals, setGoals] = useState<GoalWithStats[]>([])
  const [stats, setStats] = useState<GoalStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithStats | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'bonding', label: 'Bonding & Connection' },
    { value: 'development', label: 'Child Development' },
    { value: 'personal_growth', label: 'Personal Growth' },
    { value: 'relationship', label: 'Relationships' },
  ]

  const statusFilters = [
    { value: 'all', label: 'All Goals' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
  ]

  const fetchGoals = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterStatus === 'active') params.append('completed', 'false')
      if (filterStatus === 'completed') params.append('completed', 'true')
      
      const response = await fetch(`/api/goals?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      
      const data = await response.json()
      setGoals(data.goals || [])
      setStats(data.stats)
      setCategoryStats(data.categoryStats || {})
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchGoals()
    }
  }, [isLoaded, user, filterCategory, filterStatus])

  const handleCreateGoal = async (data: CreateGoalData) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create goal')
      }

      await fetchGoals()
      setShowGoalForm(false)
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const handleUpdateGoal = async (goalId: string, data: Partial<CreateGoalData>) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update goal')
      }

      await fetchGoals()
      setEditingGoal(null)
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete goal')
      }

      await fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      await fetchGoals()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleToggleComplete = async (goalId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed, progress: completed ? 100 : 0 }),
      })

      if (!response.ok) {
        throw new Error('Failed to update goal')
      }

      await fetchGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'overdue') {
      return goal.isOverdue && !goal.completed
    }
    return true
  })

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to track your goals and progress.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-primary" />
            Your Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Track goals, milestones, and your growth as a father
          </p>
        </div>
        
        <button
          onClick={() => setShowGoalForm(true)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Goal
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dadbase-card text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalGoals}</div>
            <div className="text-sm text-muted-foreground">Total Goals</div>
          </div>
          
          <div className="dadbase-card text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.completedGoals}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          
          <div className="dadbase-card text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.activeGoals}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          
          <div className="dadbase-card text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          {statusFilters.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="dadbase-card">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            </div>
          ) : error ? (
            <div className="dadbase-card">
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={fetchGoals}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="dadbase-card">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No goals found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filterCategory !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your filters or create a new goal.'
                    : 'Start your fatherhood journey by setting your first goal.'
                  }
                </p>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2 inline" />
                  Create Your First Goal
                </button>
              </div>
            </div>
          ) : (
            filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={setEditingGoal}
                onDelete={handleDeleteGoal}
                onUpdateProgress={handleUpdateProgress}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Goal Suggestions */}
          <GoalSuggestions
            onCreateGoal={handleCreateGoal}
          />

          {/* Category Breakdown */}
          {Object.keys(categoryStats).length > 0 && (
            <div className="dadbase-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Categories
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="mt-8">
        <GoalProgressCharts />
      </div>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowGoalForm(false)}
            mode="create"
          />
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GoalForm
            initialData={{
              title: editingGoal.title,
              description: editingGoal.description || '',
              category: editingGoal.category as 'bonding' | 'development' | 'personal_growth' | 'relationship',
              targetDate: editingGoal.targetDate ? editingGoal.targetDate.toISOString().split('T')[0] : '',
              priority: editingGoal.priority as 'low' | 'medium' | 'high',
              progress: editingGoal.progress,
            }}
            onSubmit={(data) => handleUpdateGoal(editingGoal.id, data)}
            onCancel={() => setEditingGoal(null)}
            mode="edit"
          />
        </div>
      )}
    </div>
  )
} 