'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Trophy, Target, Clock, Plus, TrendingUp } from 'lucide-react';
import { GoalWithStats } from '@/services/goal.service';

interface ProgressTrackerProps {
  className?: string;
  showAddButton?: boolean;
  maxItems?: number;
}

export default function ProgressTracker({ 
  className = '', 
  showAddButton = true,
  maxItems = 3
}: ProgressTrackerProps) {
  const { user } = useUser();
  const [goals, setGoals] = useState<GoalWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/goals?limit=5');
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'bonding': return 'text-red-600';
      case 'development': return 'text-green-600';
      case 'personal_growth': return 'text-purple-600';
      case 'relationship': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressBarColor = (progress: number, completed: boolean) => {
    if (completed) return 'bg-green-500';
    if (progress >= 75) return 'bg-green-400';
    if (progress >= 50) return 'bg-yellow-400';
    if (progress >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const formatTargetDate = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return `Due in ${Math.ceil(diffDays / 7)} weeks`;
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-4">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchGoals}
            className="text-xs text-primary hover:text-primary/80"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Achievement Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">
              {completedGoals.length} completed, {activeGoals.length} in progress
            </span>
          </div>
          {showAddButton && (
            <button
              onClick={() => window.location.href = '/progress'}
              className="text-xs text-primary hover:text-primary/80 flex items-center"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Target className="h-4 w-4 mr-2 text-primary" />
            Current Goals
          </h4>
          {activeGoals.slice(0, maxItems).map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {goal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs capitalize ${getCategoryColor(goal.category)}`}>
                      {goal.category?.replace('_', ' ')}
                    </p>
                    {goal.isOverdue && (
                      <span className="text-xs text-red-500">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(goal.progress, goal.completed)}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {/* Target Date */}
              {goal.targetDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTargetDate(goal.targetDate)}
                </div>
              )}
            </div>
          ))}
          
          {activeGoals.length > maxItems && (
            <div className="text-center pt-2">
              <button
                onClick={() => window.location.href = '/progress'}
                className="text-xs text-primary hover:text-primary/80"
              >
                View {activeGoals.length - maxItems} more goals
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Achievements */}
      {completedGoals.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-foreground flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-primary" />
            Recent Achievements
          </h4>
          {completedGoals.slice(0, 2).map((goal) => (
            <div key={goal.id} className="flex items-center space-x-3">
              <div className="p-1 bg-green-100 rounded-full">
                <Trophy className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm text-foreground line-clamp-1">
                {goal.title}
              </span>
            </div>
          ))}
          {completedGoals.length > 2 && (
            <div className="text-center">
              <button
                onClick={() => window.location.href = '/progress'}
                className="text-xs text-primary hover:text-primary/80"
              >
                View all achievements
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-8">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No goals set yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set your first fatherhood goal to get started
          </p>
          {showAddButton && (
            <button
              onClick={() => window.location.href = '/progress'}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Your First Goal
            </button>
          )}
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.href = '/progress'}
          className="text-xs text-primary hover:text-primary/80 flex items-center justify-center"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          View Progress Dashboard
        </button>
      </div>
    </div>
  );
} 