'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Trophy, X, Star, Target, Calendar } from 'lucide-react'
import { GoalWithStats } from '@/services/goal.service'

interface Notification {
  id: string
  type: 'goal_completed' | 'milestone_reached' | 'goal_overdue' | 'weekly_progress'
  title: string
  message: string
  goalId?: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

interface GoalNotificationsProps {
  className?: string
}

export default function GoalNotifications({ className = '' }: GoalNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications - in a real app, these would come from an API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'goal_completed',
      title: 'Goal Completed! 🎉',
      message: 'Congratulations! You\'ve completed "Daily bonding time with child"',
      goalId: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'milestone_reached',
      title: 'Progress Milestone',
      message: 'You\'ve reached 75% progress on "Learn about child development"',
      goalId: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'goal_overdue',
      title: 'Goal Overdue',
      message: 'Your goal "Create bedtime routine" is past its target date',
      goalId: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
      priority: 'high'
    },
    {
      id: '4',
      type: 'weekly_progress',
      title: 'Weekly Summary',
      message: 'Great work this week! You\'ve completed 2 goals and made progress on 3 others',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: true,
      priority: 'low'
    }
  ]

  useEffect(() => {
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'goal_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'milestone_reached':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'goal_overdue':
        return <Calendar className="h-5 w-5 text-red-500" />
      case 'weekly_progress':
        return <Trophy className="h-5 w-5 text-blue-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (type === 'goal_completed') return 'border-green-200 bg-green-50'
    if (type === 'goal_overdue') return 'border-red-200 bg-red-50'
    if (priority === 'high') return 'border-orange-200 bg-orange-50'
    if (priority === 'medium') return 'border-yellow-200 bg-yellow-50'
    return 'border-blue-200 bg-blue-50'
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return timestamp.toLocaleDateString()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Trophy className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete goals to see achievements here
                </p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border mb-2 transition-all duration-200 ${
                      notification.read 
                        ? 'bg-background border-border opacity-75' 
                        : getNotificationColor(notification.type, notification.priority)
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => window.location.href = '/progress'}
              className="text-xs text-primary hover:text-primary/80 w-full text-center"
            >
              View all goals →
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
} 