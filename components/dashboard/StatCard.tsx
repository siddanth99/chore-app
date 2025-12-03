'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'highlight';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'from-card to-secondary/30 border-border/50',
    primary: 'from-primary/10 to-primary/5 border-primary/20 dark:from-primary/20 dark:to-primary/10',
    accent: 'from-accent/10 to-accent/5 border-accent/20 dark:from-accent/20 dark:to-accent/10',
    highlight: 'from-highlight/10 to-highlight/5 border-highlight/20 dark:from-highlight/20 dark:to-highlight/10',
  };

  const iconStyles = {
    default: 'bg-secondary text-foreground',
    primary: 'bg-primary/20 text-primary dark:bg-primary/30',
    accent: 'bg-accent/20 text-accent dark:bg-accent/30',
    highlight: 'bg-highlight/20 text-highlight dark:bg-highlight/30',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        variantStyles[variant]
      )}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              trend.isPositive 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={cn(!trend.isPositive && 'rotate-180')}
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {trend.value}%
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconStyles[variant]
        )}>
          {icon}
        </div>
      </div>

      {/* Sparkline placeholder */}
      <div className="mt-4 h-8 flex items-end gap-0.5">
        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((height, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-t-sm bg-gradient-to-t transition-all duration-300',
              variant === 'primary' && 'from-primary/20 to-primary/40',
              variant === 'accent' && 'from-accent/20 to-accent/40',
              variant === 'highlight' && 'from-highlight/20 to-highlight/40',
              variant === 'default' && 'from-muted to-muted-foreground/30'
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
