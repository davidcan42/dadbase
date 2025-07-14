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
import GoalRecommendations from '@/features/goals/GoalRecommendations'
import AnalyticsDashboard from '@/features/analytics/AnalyticsDashboard'
import ProgressReports from '@/features/analytics/ProgressReports'
import AchievementCenter from '@/features/achievements/AchievementCenter'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'analytics' | 'achievements' | 'reports' | 'recommendations'>('overview')

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

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/goals')
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      
      const data = await response.json()
      setGoals(data.goals || [])
      setStats(data.stats || null)
      setCategoryStats(data.categoryStats || {})
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
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
    } catch (err) {
      console.error('Error updating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete goal')
      }
      
      await fetchGoals()
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
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
    } catch (err) {
      console.error('Error updating progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to update progress')
    }
  }

  const handleToggleComplete = async (goalId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: completed ? 100 : 0 }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle completion')
      }
      
      await fetchGoals()
    } catch (err) {
      console.error('Error toggling completion:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle completion')
    }
  }

  const handleShareGoal = async (goalId: string) => {
    try {
      const response = await fetch('/api/goals/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          goalId, 
          shareLevel: 'community' // Default to community sharing
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to share goal')
      }
      
      alert('Goal shared with community!')
    } catch (err) {
      console.error('Error sharing goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to share goal')
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchGoals()
    }
  }, [isLoaded, user])

  // Filter goals based on category and status
  const filteredGoals = goals.filter(goal => {
    if (filterCategory !== 'all' && goal.category !== filterCategory) {
      return false
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && goal.completed) {
        return false
      }
      if (filterStatus === 'completed' && !goal.completed) {
        return false
      }
      if (filterStatus === 'overdue' && !goal.isOverdue) {
        return false
      }
    }
    return true
  })

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in Required</h2>
          <p className="text-gray-600">Please sign in to track your goals and progress.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-8 w-8 mr-3 text-blue-600" />
              Your Progress
            </h1>
            <p className="text-gray-600 mt-1">
              Track goals, milestones, and your growth as a father
            </p>
          </div>
          
          <button
            onClick={() => setShowGoalForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Goal
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'goals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'achievements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recommendations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalGoals}</div>
                    <div className="text-sm text-gray-600">Total Goals</div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.completedGoals}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeGoals}</div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>
              )}

              {/* Progress Visualization */}
              <GoalProgressCharts />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Filter by:</span>
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusFilters.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Goals List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Your Goals
                </h2>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading goals...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">Error loading goals: {error}</p>
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No goals found for the selected filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdateProgress={handleUpdateProgress}
                        onToggleComplete={handleToggleComplete}
                        onEdit={setEditingGoal}
                        onDelete={handleDeleteGoal}
                        onShare={handleShareGoal}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Goal Suggestions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Suggestions</h3>
                                 <GoalSuggestions onCreateGoal={handleCreateGoal} />
               </div>
             </div>
           )}

           {activeTab === 'analytics' && (
             <AnalyticsDashboard />
           )}

           {activeTab === 'achievements' && (
             <AchievementCenter />
           )}

           {activeTab === 'reports' && (
             <ProgressReports />
           )}

           {activeTab === 'recommendations' && (
             <GoalRecommendations />
           )}
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
     </div>
   )
 } 