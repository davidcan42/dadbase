'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import ProgressTracker from "@/components/ProgressTracker";
import DailyInsight from "@/components/DailyInsight";
import { 
  MessageCircle, 
  Users, 
  BookOpen, 
  Clock,
  Heart,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [profileStatus, setProfileStatus] = useState<{ hasProfile: boolean; loading: boolean }>({
    hasProfile: false,
    loading: true
  });

  // Check if user has completed onboarding
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setProfileStatus({ hasProfile: false, loading: false });
        return;
      }
      
      // For testing: check localStorage first (faster)
      const hasCompletedOnboarding = localStorage.getItem('dadbase-onboarding-completed');
      if (!hasCompletedOnboarding) {
        window.location.href = '/onboarding';
        return;
      }

      // Try API call but don't block on it
      try {
        const response = await fetch('/api/users/sync', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          if (!data.user.hasProfile || !data.user.onboardingCompleted) {
            // If API says no profile but localStorage says yes, trust localStorage for testing
            setProfileStatus({ hasProfile: true, loading: false });
            return;
          }
        }
      } catch (error) {
        console.error('API unavailable, using localStorage fallback:', error);
      }
      
      // Always complete loading for testing
      setProfileStatus({ hasProfile: true, loading: false });
    };

    if (isLoaded && user) {
      checkProfile();
    } else if (isLoaded && !user) {
      setProfileStatus({ hasProfile: false, loading: false });
    }

    // Failsafe: always stop loading after 3 seconds
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, proceeding with defaults');
      if (profileStatus.loading) {
        const hasCompletedOnboarding = localStorage.getItem('dadbase-onboarding-completed');
        if (!hasCompletedOnboarding && user) {
          window.location.href = '/onboarding';
        } else {
          setProfileStatus({ hasProfile: true, loading: false });
        }
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoaded, user, profileStatus.loading]);

  if (!isLoaded || profileStatus.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to DadBase</h2>
          <p className="text-muted-foreground">Please sign in to access your father support dashboard.</p>
        </div>
      </div>
    );
  }

  // Check if user might need onboarding
  const hasCompletedOnboarding = typeof window !== 'undefined' ? localStorage.getItem('dadbase-onboarding-completed') : null;
  
  if (!hasCompletedOnboarding && profileStatus.hasProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to DadBase!</h2>
          <p className="text-muted-foreground">Let's set up your father profile to get started.</p>
          <button
            onClick={() => window.location.href = '/onboarding'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Setup
          </button>
          <div className="text-center">
            <button
              onClick={() => {
                localStorage.setItem('dadbase-onboarding-completed', 'true');
                setProfileStatus({ hasProfile: true, loading: false });
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Skip for now (testing)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mock data - this will come from the database later
  const mockGoals = [
    {
      id: '1',
      title: 'Daily bonding time with child',
      progress: 75,
      targetDate: new Date('2025-08-01'),
      completed: false,
      category: 'bonding'
    },
    {
      id: '2',
      title: 'Learn about child development milestones',
      progress: 60,
      completed: false,
      category: 'development'
    },
    {
      id: '3',
      title: 'Establish bedtime routine',
      progress: 100,
      completed: true,
      category: 'development'
    }
  ];

  const mockInsight = {
    title: "The Science of Father-Child Bonding",
    content: "Research shows that fathers' brains undergo significant changes during the first year of fatherhood, increasing sensitivity to their child's needs. The hormone vasopressin plays a crucial role in paternal bonding, making fathers more protective and nurturing.",
    source: "Dr. Anna Machin - The Life of Dad",
    category: "bonding",
    actionTip: "Spend 15 minutes in uninterrupted one-on-one time with your child today. Put away devices and focus entirely on their communication and needs."
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {greeting}, Dad! 👋
        </h1>
        <p className="text-muted-foreground">
          Your command center for evidence-based fatherhood support
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/chat" className="block">
          <DashboardCard
            title="AI Coach"
            icon={MessageCircle}
            className="text-center hover:bg-primary/5 border-primary/20"
          >
            <p className="text-sm text-muted-foreground">Get instant advice</p>
          </DashboardCard>
        </Link>

        <Link href="/community" className="block">
          <DashboardCard
            title="Community"
            icon={Users}
            className="text-center hover:bg-accent/5 border-accent/20"
          >
            <p className="text-sm text-muted-foreground">Connect with fathers</p>
          </DashboardCard>
        </Link>

        <Link href="/content" className="block">
          <DashboardCard
            title="Resources"
            icon={BookOpen}
            className="text-center hover:bg-secondary/5 border-secondary/20"
          >
            <p className="text-sm text-muted-foreground">Dr. Anna's research</p>
          </DashboardCard>
        </Link>

        <Link href="/progress" className="block">
          <DashboardCard
            title="Progress"
            icon={TrendingUp}
            className="text-center hover:bg-accent/5 border-accent/20"
          >
            <p className="text-sm text-muted-foreground">Track your journey</p>
          </DashboardCard>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Insight - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <DailyInsight insight={mockInsight} />
        </div>

        {/* Progress Tracker */}
        <div>
          <DashboardCard
            title="Your Progress"
            description="Fatherhood journey tracking"
            icon={TrendingUp}
          >
            <ProgressTracker goals={mockGoals} />
          </DashboardCard>
        </div>
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Chat History */}
        <DashboardCard
          title="Recent Conversations"
          description="Your AI coaching sessions"
          icon={MessageCircle}
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Sleep training advice</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Toddler tantrum strategies</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
            </div>
            <Link href="/chat" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
              View all conversations
              <MessageCircle className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </DashboardCard>

        {/* Community Activity */}
        <DashboardCard
          title="Community Updates"
          description="Father support network"
          icon={Users}
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">New Dads Support Group</p>
                <p className="text-xs text-muted-foreground">3 new messages</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Mentor match available</p>
                <p className="text-xs text-muted-foreground">Connect with Mike, father of 2</p>
              </div>
            </div>
            <Link href="/community" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
              View community
              <Users className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </DashboardCard>

        {/* Quick Stats */}
        <DashboardCard
          title="This Week"
          description="Your fatherhood stats"
          icon={Clock}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">AI conversations</span>
              <span className="text-lg font-semibold text-foreground">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Articles read</span>
              <span className="text-lg font-semibold text-foreground">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Goals achieved</span>
              <span className="text-lg font-semibold text-accent">1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Days active</span>
              <span className="text-lg font-semibold text-foreground">6/7</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
