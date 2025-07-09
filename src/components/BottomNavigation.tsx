'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  BookOpen,
  Plus
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, id: 'home' },
  { name: 'AI Coach', href: '/chat', icon: MessageCircle, id: 'chat' },
  { name: 'Community', href: '/community', icon: Users, id: 'community' },
  { name: 'Progress', href: '/progress', icon: TrendingUp, id: 'progress' },
  { name: 'Resources', href: '/content', icon: BookOpen, id: 'resources' },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Floating Action Button for Quick AI Chat */}
      <Link
        href="/chat"
        className="fixed bottom-20 right-4 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 md:bottom-6"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Quick Chat with AI Coach</span>
      </Link>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 text-xs font-medium transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16" />
    </>
  );
} 