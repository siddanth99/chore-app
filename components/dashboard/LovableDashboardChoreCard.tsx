'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '../chores/categories';

interface DashboardChoreCardProps {
  title: string;
  category: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicationsCount: number;
  budget: string;
  createdAt: string;
  onView?: () => void;
  onEdit?: () => void;
  onManage?: () => void;
  onViewApplications?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  open: { label: 'Open', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  in_progress: { label: 'In Progress', className: 'bg-accent/10 text-accent' },
  completed: { label: 'Completed', className: 'bg-primary/10 text-primary' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-500' },
};

export function LovableDashboardChoreCard({
  title,
  category,
  status,
  applicationsCount,
  budget,
  createdAt,
  onView,
  onEdit,
  onManage,
  onViewApplications,
}: DashboardChoreCardProps) {
  const statusInfo = statusConfig[status];
  const hasApplications = applicationsCount > 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-5',
        'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className={cn(
            'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium',
            statusInfo.className
          )}>
            {statusInfo.label}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1.5">
            <span>{getCategoryIcon(category)}</span>
            {category}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {createdAt}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onViewApplications || onView}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
              hasApplications
                ? "bg-accent/10 hover:bg-accent/20 cursor-pointer"
                : "bg-muted/50"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={hasApplications ? "text-accent" : "text-muted-foreground"}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className={cn(
              "text-sm font-medium",
              hasApplications ? "text-accent" : "text-muted-foreground"
            )}>
              {hasApplications ? `${applicationsCount} application${applicationsCount !== 1 ? 's' : ''}` : 'No applications'}
            </span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-highlight/10">
            <span className="text-sm font-medium text-highlight">{budget}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onManage}
          >
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
