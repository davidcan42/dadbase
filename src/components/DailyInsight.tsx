'use client';

import { Lightbulb, ArrowRight } from 'lucide-react';

interface DailyInsightProps {
  insight: {
    title: string;
    content: string;
    source: string;
    category: string;
    actionTip?: string;
  };
  className?: string;
}

export default function DailyInsight({ insight, className = '' }: DailyInsightProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bonding':
        return '🤝';
      case 'development':
        return '🌱';
      case 'health':
        return '💪';
      case 'communication':
        return '💬';
      case 'play':
        return '🎮';
      default:
        return '💡';
    }
  };

  return (
    <div className={`dadbase-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Lightbulb className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Today's Insight</h3>
            <p className="text-sm text-muted-foreground">From leading researchers worldwide</p>
          </div>
        </div>
        <span className="text-2xl" role="img" aria-label={insight.category}>
          {getCategoryIcon(insight.category)}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">{insight.title}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {insight.content}
          </p>
        </div>

        {/* Action Tip */}
        {insight.actionTip && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Try This Today:</p>
                <p className="text-sm text-foreground">{insight.actionTip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Source */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>Source: {insight.source}</p>
        </div>
      </div>
    </div>
  );
} 