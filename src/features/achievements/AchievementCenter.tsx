'use client'

import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Flame, 
  Star, 
  Crown, 
  Heart, 
  TrendingUp, 
  Sunrise, 
  Target,
  Zap,
  RefreshCw,
  AlertCircle,
  Lock,
  CheckCircle
} from 'lucide-react'

// Basic UI components (same as in AnalyticsDashboard)
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

// Achievement interfaces
interface Achievement {
  id: string
  type: string
  title: string
  description: string
  icon: string
  metadata: any
  earnedAt: string
}

interface StreakData {
  streakType: 'daily' | 'weekly' | 'monthly'
  currentCount: number
  longestCount: number
  lastActivity: string
  isActive: boolean
}

interface AchievementSummary {
  totalAchievements: number
  recentAchievements: Achievement[]
  activeStreaks: StreakData[]
  longestStreak: number
  completionRate: number
  nextAchievements: NextAchievement[]
}

interface NextAchievement {
  type: string
  title: string
  description: string
  icon: string
  progress: number
}

export default function AchievementCenter() {
  const [achievementData, setAchievementData] = useState<{
    achievements: Achievement[]
    streaks: { [key: string]: StreakData }
    summary: AchievementSummary
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAchievementData()
  }, [])

  const fetchAchievementData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/achievements')
      if (!response.ok) {
        throw new Error('Failed to fetch achievement data')
      }
      
      const result = await response.json()
      setAchievementData(result.data)
    } catch (error) {
      console.error('Error fetching achievements:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const checkForNewAchievements = async () => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkNewAchievements'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to check for new achievements')
      }
      
      const result = await response.json()
      if (result.data.hasNewAchievements) {
        // Refresh the achievement data
        fetchAchievementData()
        
        // Show celebration or notification
        console.log('New achievements unlocked!', result.data.newAchievements)
      }
    } catch (error) {
      console.error('Error checking for new achievements:', error)
    }
  }

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      target: Target,
      crown: Crown,
      flame: Flame,
      zap: Zap,
      heart: Heart,
      'trending-up': TrendingUp,
      sunrise: Sunrise,
      star: Star,
      trophy: Trophy
    }
    return icons[iconName as keyof typeof icons] || Target
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  const getStreakColor = (streakType: string) => {
    const colors = {
      daily: 'text-orange-500',
      weekly: 'text-blue-500',
      monthly: 'text-purple-500'
    }
    return colors[streakType as keyof typeof colors] || 'text-gray-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading achievements...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-lg text-red-600">Error: {error}</span>
        <Button onClick={fetchAchievementData} className="ml-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!achievementData) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-lg text-gray-600">No achievement data available</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Achievement Center</h1>
          <p className="text-gray-600 mt-1">
            Track your fatherhood journey milestones and rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkForNewAchievements} variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            Check New
          </Button>
          <Button onClick={fetchAchievementData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Achievement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementData.summary.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">
              Badges earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementData.summary.longestStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementData.summary.activeStreaks.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementData.summary.completionRate}%</div>
            <Progress value={achievementData.summary.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Achievement Tabs */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievementData.achievements.map((achievement) => {
              const IconComponent = getAchievementIcon(achievement.icon)
              return (
                <Card key={achievement.id} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {achievement.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(achievement.earnedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {achievementData.achievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No achievements yet</h3>
              <p className="text-gray-500 mt-2">Complete your first goal to earn your first achievement!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(achievementData.streaks).map(([streakType, streak]) => (
              <Card key={streakType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className={`h-5 w-5 ${getStreakColor(streakType)}`} />
                    {streakType.charAt(0).toUpperCase() + streakType.slice(1)} Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">{streak.currentCount}</div>
                    <p className="text-sm text-gray-600">
                      {streak.isActive ? 'Current streak' : 'Broken streak'}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Best: {streak.longestCount}</span>
                      <span>Last: {formatDate(streak.lastActivity)}</span>
                    </div>
                    <div className="mt-3">
                      <Badge 
                        variant={streak.isActive ? "default" : "secondary"}
                        className="w-full justify-center"
                      >
                        {streak.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Achievements</CardTitle>
              <CardDescription>
                Achievements you're working towards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievementData.summary.nextAchievements.map((next, index) => {
                  const IconComponent = getAchievementIcon(next.icon)
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{next.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{next.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{Math.round(next.progress)}%</span>
                          </div>
                          <Progress value={next.progress} />
                        </div>
                      </div>
                      <div className="p-2">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {achievementData.summary.nextAchievements.length === 0 && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">All achievements unlocked!</h3>
                  <p className="text-gray-500 mt-2">You've completed all available achievements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 