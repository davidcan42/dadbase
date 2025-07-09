'use client';

import { useUser } from "@clerk/nextjs";
import { MessageCircle, Bot } from "lucide-react";

export default function ChatPage() {
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
          <h2 className="text-xl font-semibold text-foreground mb-2">AI Coach</h2>
          <p className="text-muted-foreground">Please sign in to chat with your AI coaching assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <Bot className="h-8 w-8 mr-3 text-primary" />
          AI Coach
        </h1>
        <p className="text-muted-foreground">
          Get personalized advice based on Dr. Anna Machin's research
        </p>
      </div>

      {/* Chat Interface Placeholder */}
      <div className="dadbase-card min-h-[500px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                AI Chat Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md">
                Your personalized AI coach will be available here to provide 24/7 support 
                based on scientific research from Dr. Anna Machin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 