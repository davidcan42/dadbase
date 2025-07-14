'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Calendar, 
  Target, 
  Trophy,
  Clock,
  CheckCircle 
} from 'lucide-react'

interface CategoryStats {
  [key: string]: {
    total: number
    completed: number
    avgProgress: number
  }
}

interface GoalStats {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  overdueGoals: number
  completionRate: number
}

interface TimelineData {
  month: string
  completed: number
  created: number
}

export default function GoalProgressCharts() {
  const { user } = useUser()
  const [stats, setStats] = useState<GoalStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categoryColors = {
    bonding: '#ef4444',
    development: '#22c55e',
    personal_growth: '#8b5cf6',
    relationship: '#3b82f6',
  }

  const categoryLabels = {
    bonding: 'Bonding & Connection',
    development: 'Child Development',
    personal_growth: 'Personal Growth',
    relationship: 'Relationships',
  }

  const fetchChartData = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/goals')
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }
      
      const data = await response.json()
      setStats(data.stats)
      setCategoryStats(data.categoryStats || {})
      
      // Mock timeline data - in a real app, this would come from the API
      setTimelineData([
        { month: 'Jan', completed: 2, created: 3 },
        { month: 'Feb', completed: 4, created: 5 },
        { month: 'Mar', completed: 3, created: 4 },
        { month: 'Apr', completed: 6, created: 6 },
        { month: 'May', completed: 5, created: 7 },
        { month: 'Jun', completed: 4, created: 5 },
      ])
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchChartData()
    }
  }, [user])

  const CircularProgress = ({ 
    percentage, 
    color = '#3b82f6', 
    size = 120, 
    strokeWidth = 8 
  }: {
    percentage: number
    color?: string
    size?: number
    strokeWidth?: number
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{percentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </div>
    )
  }

  const BarChart = ({ data, maxValue }: { data: TimelineData[], maxValue: number }) => {
    const chartHeight = 120 // Fixed height for bars
    const safeMaxValue = Math.max(maxValue, 1) // Prevent division by zero
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Goals Activity</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Created</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-3 pb-6" style={{ height: chartHeight + 40 }}>
          {data.map((item, index) => {
            const completedHeight = Math.max((item.completed / safeMaxValue) * chartHeight, item.completed > 0 ? 4 : 0)
            const createdHeight = Math.max((item.created / safeMaxValue) * chartHeight, item.created > 0 ? 4 : 0)
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center gap-1 mb-2" style={{ height: chartHeight }}>
                  {/* Completed bar */}
                  <div className="flex flex-col justify-end w-4">
                    <div
                      className="bg-green-500 rounded-t-sm transition-all duration-500 w-full"
                      style={{ height: `${completedHeight}px` }}
                    />
                  </div>
                  {/* Created bar */}
                  <div className="flex flex-col justify-end w-4">
                    <div
                      className="bg-blue-500 rounded-t-sm transition-all duration-500 w-full"
                      style={{ height: `${createdHeight}px` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground text-center whitespace-nowrap">
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchChartData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!stats || Object.keys(categoryStats).length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No data available
        </h3>
        <p className="text-muted-foreground">
          Create some goals to see your progress visualizations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Progress Visualization
        </h2>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="dadbase-card">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Overall Progress
            </h3>
            <CircularProgress 
              percentage={stats.completionRate}
              color="#3b82f6"
            />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {stats.completedGoals}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {stats.activeGoals}
                </div>
                <div className="text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="dadbase-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Categories
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, data]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium text-foreground capitalize">
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {data.completed}/{data.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${data.avgProgress}%`,
                      backgroundColor: categoryColors[category as keyof typeof categoryColors] || '#6b7280'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="dadbase-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            6-Month Trend
          </h3>
          <BarChart 
            data={timelineData} 
            maxValue={Math.max(...timelineData.map(d => Math.max(d.completed, d.created)))} 
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dadbase-card text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalGoals}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Goals Set
          </div>
        </div>

        <div className="dadbase-card text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.overdueGoals}
          </div>
          <div className="text-sm text-muted-foreground">
            Overdue Goals
          </div>
        </div>

        <div className="dadbase-card text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.completionRate}%
          </div>
          <div className="text-sm text-muted-foreground">
            Success Rate
          </div>
        </div>
      </div>
    </div>
  )
} 