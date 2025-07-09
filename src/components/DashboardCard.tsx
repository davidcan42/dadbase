'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function DashboardCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className = '',
  onClick 
}: DashboardCardProps) {
  const baseClasses = "dadbase-card transition-all duration-200 hover:shadow-md";
  const clickableClasses = onClick ? "cursor-pointer hover:scale-[1.02]" : "";
  
  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="text-foreground">
        {children}
      </div>
    </div>
  );
} 