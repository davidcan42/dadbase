'use client';

import { useUser } from "@clerk/nextjs";
import FatherProfileForm from "@/components/FatherProfileForm";
import { User, Edit } from "lucide-react";

export default function ProfilePage() {
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Father Profile</h2>
          <p className="text-muted-foreground">Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  // TODO: Fetch existing profile data from database
  // const existingProfile = await fetchFatherProfile(userId);
  const existingProfile = null; // Placeholder

  const handleProfileSubmit = async (data: any) => {
    try {
      // TODO: Save profile data to database
      console.log('Profile data:', data);
      // await saveFatherProfile(userId, data);
      alert('Profile saved successfully!'); // Temporary feedback
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
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
      <FatherProfileForm
        initialData={existingProfile || undefined}
        onSubmit={handleProfileSubmit}
        isLoading={false}
      />

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
    </div>
  );
} 