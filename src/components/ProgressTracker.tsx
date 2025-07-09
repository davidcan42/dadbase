'use client';

import { Trophy, Target, Clock } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  progress: number;
  targetDate?: Date;
  completed: boolean;
  category: string;
}

interface ProgressTrackerProps {
  goals: Goal[];
  className?: string;
}

export default function ProgressTracker({ goals, className = '' }: ProgressTrackerProps) {
  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bonding': return 'text-blue-600';
      case 'development': return 'text-green-600';
      case 'personal_growth': return 'text-purple-600';
      case 'relationship': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={className}>
      {/* Achievement Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-accent" />
            <span className="font-medium text-foreground">
              {completedGoals.length} completed, {activeGoals.length} in progress
            </span>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center">
            <Target className="h-4 w-4 mr-2 text-primary" />
            Current Goals
          </h4>
          {activeGoals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{goal.title}</p>
                  <p className={`text-xs ${getCategoryColor(goal.category)}`}>
                    {goal.category.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {/* Target Date */}
              {goal.targetDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Target: {goal.targetDate.toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Achievements */}
      {completedGoals.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-foreground flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-accent" />
            Recent Achievements
          </h4>
          {completedGoals.slice(0, 2).map((goal) => (
            <div key={goal.id} className="flex items-center space-x-3">
              <div className="p-1 bg-accent/10 rounded-full">
                <Trophy className="h-3 w-3 text-accent" />
              </div>
              <span className="text-sm text-foreground">{goal.title}</span>
            </div>
          ))}
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
        </div>
      )}
    </div>
  );
} 