'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatGoalSuggestions from '@/features/goals/ChatGoalSuggestions';
import { Plus, MoreHorizontal, Archive, Trash2, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface ChatThread {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  lastMessageTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to safely convert date strings to Date objects
const safeDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

export default function ChatInterface() {
  const { user } = useUser();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat threads
  useEffect(() => {
    const loadThreads = async () => {
      if (!user) {
        setIsLoadingThreads(false);
        return;
      }
      
      try {
        // Try to sync user first (but don't block)
        try {
          await fetch('/api/users/sync', { method: 'POST' });
        } catch (syncError) {
          console.log('User sync failed, continuing with local mode');
        }
        
        // Try to load threads
        const response = await fetch('/api/chat/threads');
        if (response.ok) {
          const data = await response.json();
          // Convert date strings to Date objects
          const threadsWithDates = data.threads.map((thread: any) => ({
            ...thread,
            lastMessageTime: safeDate(thread.lastMessageTime),
            createdAt: safeDate(thread.createdAt),
            updatedAt: safeDate(thread.updatedAt)
          }));
          setThreads(threadsWithDates);
          
          // Auto-select first thread if available
          if (threadsWithDates.length > 0 && !currentThread) {
            setCurrentThread(threadsWithDates[0]);
          }
        }
      } catch (error) {
        console.error('API unavailable, starting with empty threads:', error);
        // For testing: just continue with empty threads
        setThreads([]);
      } finally {
        setIsLoadingThreads(false);
      }
    };

    // Always complete loading quickly for testing
    setTimeout(() => setIsLoadingThreads(false), 1000);
    
    if (user) {
      loadThreads();
    } else {
      setIsLoadingThreads(false);
    }
  }, [user]);

  // Load messages for current thread
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentThread) return;
      
      setIsLoadingMessages(true);
      try {
        const response = await fetch(`/api/chat/threads/${currentThread.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.thread.messages.map((msg: any) => ({
            ...msg,
            timestamp: safeDate(msg.timestamp)
          })));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentThread]);

  // Create new thread
  const createNewThread = async () => {
    console.log('Creating new thread...');
    
    // Always create a fallback thread first for testing
    const fallbackThread: ChatThread = {
      id: 'fallback-' + Date.now(),
      title: 'Test Chat',
      messageCount: 0,
      lastMessage: null,
      lastMessageTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setThreads([fallbackThread, ...threads]);
    setCurrentThread(fallbackThread);
    setMessages([]);
    console.log('Fallback thread created:', fallbackThread);
    
    // Try API in background (but don't block)
    try {
      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newThread: ChatThread = {
          id: data.thread.id,
          title: data.thread.title,
          messageCount: 0,
          lastMessage: null,
          lastMessageTime: new Date(data.thread.createdAt),
          createdAt: new Date(data.thread.createdAt),
          updatedAt: new Date(data.thread.createdAt)
        };
        
        // Replace the fallback thread with the real one
        setThreads(prev => prev.map(t => t.id === fallbackThread.id ? newThread : t));
        setCurrentThread(newThread);
        console.log('Thread created successfully and replaced fallback:', newThread);
      }
    } catch (error) {
      console.log('API not available, keeping fallback thread:', error);
    }
  };

  // Send message
  const sendMessage = async (content: string) => {
    if (!currentThread || !content.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThread.id,
          content,
          role: 'user'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(prev => [...prev, ...newMessages]);
        
        // Update thread in list
        setThreads(prev => prev.map(thread => 
          thread.id === currentThread.id 
            ? { ...thread, lastMessage: content, lastMessageTime: new Date() }
            : thread
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback: add messages locally for testing
      const userMessage: Message = {
        id: 'user-' + Date.now(),
        content,
        role: 'user',
        timestamp: new Date()
      };
      
      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        content: `Thanks for your message! I understand you're asking about "${content}". As a father support AI coach, I'm here to help with your parenting journey. While I'm currently in development, I can already provide guidance based on Dr. Anna Machin's research on fatherhood.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Update thread in list
      setThreads(prev => prev.map(thread => 
        thread.id === currentThread.id 
          ? { ...thread, lastMessage: content, lastMessageTime: new Date() }
          : thread
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete thread
  const deleteThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (currentThread?.id === threadId) {
          setCurrentThread(threads.find(t => t.id !== threadId) || null);
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  // Create goal from chat
  const createGoalFromChat = async (data: any) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      // Show success feedback
      console.log('Goal created successfully from chat');
    } catch (error) {
      console.error('Error creating goal from chat:', error);
    }
  };

  if (isLoadingThreads) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading your chats...</h2>
          <p className="text-muted-foreground">Please wait while we load your conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Thread List */}
      <div className="w-80 border-r border-border bg-card hidden md:flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
            <button
              onClick={() => {
                console.log('Button clicked: Plus button');
                createNewThread();
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <button
                onClick={() => {
                  console.log('Button clicked: Start your first chat');
                  createNewThread();
                }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Start your first chat
              </button>
            </div>
          ) : (
            threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => setCurrentThread(thread)}
                className={`
                  p-3 cursor-pointer hover:bg-muted/50 border-b border-border
                  ${currentThread?.id === thread.id ? 'bg-muted' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {thread.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.lastMessage || 'No messages yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {thread.lastMessageTime.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {currentThread.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    AI Coach - Powered by Dr. Anna Machin's research
                  </p>
                </div>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Ask me anything about fatherhood, child development, or parenting concerns.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Goal Suggestions - Only show when there are messages */}
            {messages.length > 0 && currentThread && (
              <div className="px-4 pb-4">
                <ChatGoalSuggestions
                  threadId={currentThread.id}
                  onCreateGoal={createGoalFromChat}
                />
              </div>
            )}

            {/* Input */}
            <ChatInput
              onSendMessage={sendMessage}
              isLoading={isLoading}
              placeholder="Ask your AI coach anything about fatherhood..."
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Welcome to your AI Coach
              </h3>
              <p className="text-muted-foreground mb-4">
                Get personalized advice based on Dr. Anna Machin's research
              </p>
              <button
                onClick={() => {
                  console.log('Button clicked: Start Your First Chat');
                  createNewThread();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Start Your First Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 