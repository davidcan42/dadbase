'use client'

import React, { useState, useEffect } from 'react'
// Basic UI components for the analytics dashboard
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`dadbase-card ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`${className}`}>{children}</div>
)

const Button = ({ children, onClick, variant = "default", size = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === "outline" 
        ? "border border-border bg-transparent hover:bg-accent"
        : "bg-primary text-primary-foreground hover:bg-primary/90"
    } ${size === "sm" ? "px-3 py-1 text-sm" : ""} ${className}`}
  >
    {children}
  </button>
)

const Badge = ({ children, className = "", variant = "default" }: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary";
}) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
    variant === "secondary" 
      ? "bg-secondary text-secondary-foreground"
      : "bg-primary text-primary-foreground"
  } ${className}`}>
    {children}
  </span>
)

const Progress = ({ value, className = "" }: { value: number; className?: string }) => (
  <div className={`w-full bg-secondary rounded-full h-2 ${className}`}>
    <div 
      className="bg-primary h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

const Tabs = ({ children, defaultValue, className = "" }: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <div className={`${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, child => 
        React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab }) : child
      )}
    </div>
  )
}

const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex space-x-1 bg-muted p-1 rounded-lg ${className}`}>
    {children}
  </div>
)

const TabsTrigger = ({ children, value, activeTab, setActiveTab, className = "" }: {
  children: React.ReactNode;
  value: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  className?: string;
}) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
      activeTab === value
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    } ${className}`}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeTab, className = "" }: {
  children: React.ReactNode;
  value: string;
  activeTab?: string;
  className?: string;
}) => (
  <div 
    className={`${activeTab === value ? "block" : "hidden"} ${className}`}
  >
    {children}
  </div>
)
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  AlertCircle,
  Calendar,
  Trophy,
  Flame,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  overdueGoals: number
  completionRate: number
  averageCompletionTime: number
  categoryPerformance: CategoryPerformance[]
  monthlyTrends: MonthlyTrend[]
  weeklyProgress: WeeklyProgress[]
  priorityDistribution: PriorityDistribution[]
  upcomingDeadlines: UpcomingDeadline[]
}

interface CategoryPerformance {
  category: string
  totalGoals: number
  completedGoals: number
  completionRate: number
  averageProgress: number
  averageCompletionTime: number
}

interface MonthlyTrend {
  month: string
  year: number
  goalsCreated: number
  goalsCompleted: number
  completionRate: number
  averageProgress: number
}

interface WeeklyProgress {
  week: string
  weekStart: Date
  weekEnd: Date
  goalsWorkedOn: number
  progressMade: number
  goalsCompleted: number
}

interface PriorityDistribution {
  priority: string
  count: number
  completionRate: number
  averageCompletionTime: number
}

interface UpcomingDeadline {
  goalId: string
  title: string
  targetDate: Date
  daysUntilDeadline: number
  progress: number
  priority: string
  category: string
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const result = await response.json()
      setAnalyticsData(result.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      bonding: 'bg-pink-100 text-pink-800',
      development: 'bg-blue-100 text-blue-800',
      personal_growth: 'bg-green-100 text-green-800',
      relationship: 'bg-purple-100 text-purple-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-lg text-red-600">Error: {error}</span>
        <Button onClick={fetchAnalyticsData} className="ml-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-lg text-gray-600">No analytics data available</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goal Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your fatherhood journey progress and insights
          </p>
        </div>
        <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <Progress value={analyticsData.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeGoals}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overdueGoals} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageCompletionTime}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>
                  Your goal activity over the past 8 weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.weeklyProgress.map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{week.week}</span>
                        <Badge variant="secondary" className="text-xs">
                          {week.goalsCompleted} completed
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(week.progressMade * 2, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {week.progressMade}% progress
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Priority Distribution
                </CardTitle>
                <CardDescription>
                  How your goals are distributed by priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.priorityDistribution.map((priority, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(priority.priority)}>
                          {priority.priority}
                        </Badge>
                        <span className="text-sm">{priority.count} goals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${priority.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {priority.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                How you're performing across different goal categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.categoryPerformance.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(category.category)}>
                          {category.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {category.totalGoals} goals
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{category.completionRate}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <div className="font-medium">{category.completedGoals}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Progress:</span>
                        <div className="font-medium">{category.averageProgress}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Time:</span>
                        <div className="font-medium">{category.averageCompletionTime}d</div>
                      </div>
                    </div>
                    <Progress value={category.completionRate} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>
                Your goal creation and completion trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.monthlyTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {trend.month} {trend.year}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{trend.goalsCreated} created</span>
                        <span>•</span>
                        <span>{trend.goalsCompleted} completed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${trend.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{trend.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>
                Goals with approaching target dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.upcomingDeadlines.length > 0 ? (
                  analyticsData.upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{deadline.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(deadline.priority)}>
                            {deadline.priority}
                          </Badge>
                          <Badge className={getCategoryColor(deadline.category)}>
                            {deadline.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Due: {formatDate(deadline.targetDate)}</span>
                        <span>
                          {deadline.daysUntilDeadline > 0 
                            ? `${deadline.daysUntilDeadline} days left`
                            : 'Overdue'
                          }
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{deadline.progress}%</span>
                        </div>
                        <Progress value={deadline.progress} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming deadlines
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 