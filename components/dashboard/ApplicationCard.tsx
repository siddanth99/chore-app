'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ApplicationCardProps {
  choreTitle: string;
  choreCategory: string;
  bid: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  onView?: () => void;
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    className: 'bg-highlight/10 text-highlight border-highlight/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  },
  accepted: { 
    label: 'Accepted', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>
    )
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    )
  },
};

export function ApplicationCard({
  choreTitle,
  choreCategory,
  bid,
  status,
  appliedAt,
  onView,
}: ApplicationCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
      )}
    >
      {/* Status indicator bar */}
      <div className={cn(
        'h-1 w-full',
        status === 'pending' && 'bg-gradient-to-r from-highlight/50 to-highlight',
        status === 'accepted' && 'bg-gradient-to-r from-green-500/50 to-green-500',
        status === 'rejected' && 'bg-gradient-to-r from-red-500/50 to-red-500'
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {choreTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{choreCategory}</p>
          </div>
          <span className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            statusInfo.className
          )}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </div>

        {/* Bid and date */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your bid</p>
              <p className="text-sm font-semibold text-foreground">{bid}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applied</p>
              <p className="text-sm font-medium text-foreground">{appliedAt}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
        >
          View Details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
