'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AssignedCardProps {
  title: string;
  category: string;
  assignedTo?: string; // For customer view
  assignedBy?: string; // For worker view
  progress: number; // 0-100
  dueDate: string;
  budget: string;
  onChat?: () => void;
  onMarkComplete?: () => void;
  onManage?: () => void;
  isWorkerView?: boolean;
}

export function AssignedCard({
  title,
  category,
  assignedTo,
  assignedBy,
  progress,
  dueDate,
  budget,
  onChat,
  onMarkComplete,
  onManage,
  isWorkerView = false,
}: AssignedCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
      )}
    >
      {/* Progress bar at top */}
      <div className="h-1.5 w-full bg-secondary">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{category}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-primary">{progress}%</p>
            <p className="text-xs text-muted-foreground">complete</p>
          </div>
        </div>

        {/* Assignment info */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium text-sm">
            {(assignedTo || assignedBy || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {isWorkerView ? 'Assigned by' : 'Assigned to'}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {isWorkerView ? assignedBy : assignedTo}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onChat} className="shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Button>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Due: {dueDate}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-highlight/10 text-highlight font-medium">
            {budget}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isWorkerView ? (
            <Button
              variant="default"
              size="sm"
              onClick={onMarkComplete}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
              Mark Complete
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onManage}
              className="flex-1"
            >
              Manage Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
