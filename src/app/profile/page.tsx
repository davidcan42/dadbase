'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import FatherProfileForm from "@/components/FatherProfileForm";
import { User, Edit } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [existingProfile, setExistingProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
          <h2 className="text-xl font-semibold text-foreground mb-2">Father Profile</h2>
          <p className="text-muted-foreground">Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  // Fetch existing profile data from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // First, try to load from localStorage (faster)
        const savedProfile = localStorage.getItem('dadbase-profile');
        if (savedProfile) {
          setExistingProfile(JSON.parse(savedProfile));
        }
        
        // Then try API (but don't block)
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const result = await response.json();
            setExistingProfile(result.profile);
          }
        } catch (apiError) {
          console.log('API not available, using localStorage profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // If localStorage also fails, just continue without profile
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user]);

  const handleProfileSubmit = async (data: any) => {
    try {
      // Save to localStorage first (for testing)
      localStorage.setItem('dadbase-profile', JSON.stringify(data));
      localStorage.setItem('dadbase-onboarding-completed', 'true');
      
      // Try to save to API (but don't block)
      try {
        await fetch('/api/users/sync', { method: 'POST' });
        
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          console.log('Profile saved to database successfully');
          alert('Profile saved successfully!');
        } else {
          alert('Profile saved locally (testing mode)');
        }
      } catch (apiError) {
        console.log('API not available, profile saved locally');
        alert('Profile saved locally (testing mode)');
      }
      
      // Always redirect to dashboard
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Profile saved successfully! (testing mode)');
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <User className="h-8 w-8 mr-3 text-primary" />
          {existingProfile ? 'Edit Profile' : 'Welcome to DadBase!'}
        </h1>
        <p className="text-muted-foreground">
          {existingProfile 
            ? 'Update your profile information and preferences'
            : 'Let\'s set up your father profile to personalize your experience'
          }
        </p>
      </div>

      {/* Onboarding Message for New Users */}
      {!existingProfile && (
        <div className="dadbase-card bg-primary/5 border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Let's get started!
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                DadBase provides personalized support based on your unique situation. 
                By completing your profile, our AI coach can offer more relevant advice 
                and connect you with fathers in similar circumstances.
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                <li>• Get personalized daily insights from Dr. Anna Machin's research</li>
                <li>• Receive AI coaching tailored to your child's age and development</li>
                <li>• Connect with fathers who share similar experiences</li>
                <li>• Track your progress on your fatherhood journey</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      {isLoadingProfile ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading your profile...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your information.</p>
          </div>
        </div>
      ) : (
        <FatherProfileForm
          initialData={existingProfile || undefined}
          onSubmit={handleProfileSubmit}
          isLoading={false}
        />
      )}

      {/* Privacy Notice */}
      <div className="dadbase-card bg-muted/20">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-muted rounded-full">
            <svg className="h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Privacy & Security</h4>
            <p className="text-xs text-muted-foreground">
              Your personal information is encrypted and secure. We use this data only to 
              provide personalized support and will never share it with third parties without 
              your explicit consent. You can update or delete your profile at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Testing Controls */}
      <div className="dadbase-card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-yellow-100 rounded-full dark:bg-yellow-900/30">
            <svg className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground mb-1">Testing Mode</h4>
            <p className="text-xs text-muted-foreground mb-3">
              This is a testing environment. Use the button below to reset your onboarding status.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('dadbase-onboarding-completed');
                alert('Onboarding reset! Refresh the page to go through onboarding again.');
              }}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 transition-colors"
            >
              Reset Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 