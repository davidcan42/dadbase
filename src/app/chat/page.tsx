'use client';

import { useUser } from "@clerk/nextjs";
import ChatInterface from "@/components/ChatInterface";
import { Bot } from "lucide-react";

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-center md:text-left p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center justify-center md:justify-start">
          <Bot className="h-6 w-6 mr-3 text-primary" />
          AI Coach
        </h1>
        <p className="text-muted-foreground text-sm">
          Get personalized advice based on Dr. Anna Machin's research
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
} 