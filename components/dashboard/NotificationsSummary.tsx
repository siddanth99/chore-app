'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationsSummaryProps {
  unreadCount: number;
  recentNotifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'application' | 'message' | 'payment' | 'system';
  }>;
  onViewAll?: () => void;
}

const typeConfig = {
  application: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: 'text-accent bg-accent/10',
  },
  message: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: 'text-primary bg-primary/10',
  },
  payment: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    color: 'text-highlight bg-highlight/10',
  },
  system: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    color: 'text-muted-foreground bg-muted',
  },
};

export function NotificationsSummary({
  unreadCount,
  recentNotifications,
  onViewAll,
}: NotificationsSummaryProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full animate-pulse-soft">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Recent notifications */}
      <div className="divide-y divide-border/50">
        {recentNotifications.slice(0, 3).map((notification) => {
          const config = typeConfig[notification.type];
          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50 cursor-pointer'
              )}
            >
              <div className={cn('shrink-0 p-2 rounded-lg', config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {notification.message}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {notification.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
