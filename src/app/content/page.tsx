'use client';

import { useUser } from "@clerk/nextjs";
import { BookOpen, Search } from "lucide-react";

export default function ContentPage() {
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Research Library</h2>
          <p className="text-muted-foreground">Please sign in to access leading research on fatherhood.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <BookOpen className="h-8 w-8 mr-3 text-secondary" />
          Research Library
        </h1>
        <p className="text-muted-foreground">
          Access groundbreaking research on fatherhood and child development from leading experts worldwide
        </p>
      </div>

      {/* Content Placeholder */}
      <div className="dadbase-card min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Research Library Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md">
                Explore evidence-based content from leading researchers on 
                paternal neuroscience and child development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 