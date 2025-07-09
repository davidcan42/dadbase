'use client';

import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
  };
  className?: string;
}

export default function ChatMessage({ message, className = '' }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          ) : isAssistant ? (
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-accent-foreground" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground">SYS</span>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`
              px-4 py-2 rounded-lg text-sm leading-relaxed
              ${isUser 
                ? 'bg-primary text-primary-foreground' 
                : isAssistant 
                  ? 'bg-card border border-border text-foreground' 
                  : 'bg-muted text-muted-foreground'
              }
              ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}
              max-w-full word-wrap
            `}
          >
            {message.content}
          </div>

          {/* Timestamp */}
          <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 