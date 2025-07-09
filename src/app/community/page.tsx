'use client';

import { useUser } from "@clerk/nextjs";
import { Users, Heart } from "lucide-react";

export default function CommunityPage() {
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Father Community</h2>
          <p className="text-muted-foreground">Please sign in to connect with other fathers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <Users className="h-8 w-8 mr-3 text-accent" />
          Father Community
        </h1>
        <p className="text-muted-foreground">
          Connect with other fathers for support, advice, and shared experiences
        </p>
      </div>

      {/* Community Placeholder */}
      <div className="dadbase-card min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Community Features Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md">
                Join father support groups, find mentors, and connect with other dads 
                who understand your journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 