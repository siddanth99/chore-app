'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  variant?: 'primary' | 'accent' | 'highlight' | 'default';
}

function QuickAction({ icon, label, description, onClick, variant = 'default' }: QuickActionProps) {
  const variantStyles = {
    primary: 'hover:border-primary/50 hover:bg-primary/5 group-hover:text-primary',
    accent: 'hover:border-accent/50 hover:bg-accent/5 group-hover:text-accent',
    highlight: 'hover:border-highlight/50 hover:bg-highlight/5 group-hover:text-highlight',
    default: 'hover:border-border hover:bg-secondary/50',
  };

  const iconStyles = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    accent: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
    highlight: 'bg-highlight/10 text-highlight group-hover:bg-highlight group-hover:text-highlight-foreground',
    default: 'bg-secondary text-muted-foreground group-hover:bg-foreground group-hover:text-background',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-left w-full',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        variantStyles[variant]
      )}
    >
      <div className={cn(
        'shrink-0 p-3 rounded-xl transition-all duration-300',
        iconStyles[variant]
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-semibold text-foreground transition-colors',
          variantStyles[variant]
        )}>
          {label}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
      </div>
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}

interface QuickActionsProps {
  isWorker?: boolean;
}

export function QuickActions({ isWorker = false }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {!isWorker && (
        <QuickAction
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          }
          label="Post a Chore"
          description="Create a new task for workers"
          onClick={() => router.push('/chores/new')}
        />
      )}
      <QuickAction
        variant="accent"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        }
        label="Browse Chores"
        description="Find available tasks nearby"
        onClick={() => router.push('/chores')}
      />
      <QuickAction
        variant="highlight"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        }
        label="View Notifications"
        description="Check your latest updates"
        onClick={() => router.push('/notifications')}
      />
      <QuickAction
        variant="default"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
        label="Go to Profile"
        description="Manage your account settings"
        onClick={() => router.push('/profile')}
      />
    </div>
  );
}
