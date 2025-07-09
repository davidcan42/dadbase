'use client';

import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from './theme-toggle';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function TopHeader() {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-xl font-bold text-foreground">DadBase</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Your Command Center for Fatherhood</p>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                href="/profile" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </Link>
            </nav>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
} 