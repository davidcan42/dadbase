'use client';

import { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  isLoading = false,
  placeholder = "Type your message...",
  className = '' 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceRecording = () => {
    setIsVoiceRecording(!isVoiceRecording);
    // TODO: Implement voice recording functionality
    if (!isVoiceRecording) {
      // Start recording
      console.log('Starting voice recording...');
    } else {
      // Stop recording
      console.log('Stopping voice recording...');
    }
  };

  return (
    <div className={`bg-card border-t border-border p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Voice Recording Button */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`
            flex-shrink-0 p-2 rounded-full transition-colors
            ${isVoiceRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            }
          `}
          disabled={isLoading}
        >
          {isVoiceRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="
              w-full px-4 py-2 border border-border rounded-lg 
              focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none overflow-hidden
              min-h-[44px] max-h-32
              bg-background text-foreground placeholder-muted-foreground
            "
            style={{ 
              height: 'auto',
              minHeight: '44px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="
            flex-shrink-0 p-2 rounded-full bg-primary text-primary-foreground
            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <QuickActionButton 
          text="How can I bond with my child?"
          onClick={() => onSendMessage("How can I bond with my child?")}
          disabled={isLoading}
        />
        <QuickActionButton 
          text="Sleep training tips"
          onClick={() => onSendMessage("Can you give me some sleep training tips?")}
          disabled={isLoading}
        />
        <QuickActionButton 
          text="Child development milestones"
          onClick={() => onSendMessage("What are important child development milestones?")}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

function QuickActionButton({ text, onClick, disabled = false }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        px-3 py-1 text-xs rounded-full border border-border
        hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors text-muted-foreground hover:text-foreground
      "
    >
      {text}
    </button>
  );
} 