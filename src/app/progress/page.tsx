'use client';

import { useUser } from "@clerk/nextjs";
import { TrendingUp, Target } from "lucide-react";

export default function ProgressPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Progress Tracking</h2>
          <p className="text-muted-foreground">Please sign in to track your fatherhood journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <TrendingUp className="h-8 w-8 mr-3 text-accent" />
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track goals, milestones, and your growth as a father
        </p>
      </div>

      {/* Progress Placeholder */}
      <div className="dadbase-card min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Progress Tracking Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md">
                Set fatherhood goals, track milestones, and celebrate your achievements 
                on this meaningful journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 