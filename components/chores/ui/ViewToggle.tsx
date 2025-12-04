'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, List, Map } from 'lucide-react';
import { ViewMode } from '../../types';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const VIEW_OPTIONS: { value: ViewMode; icon: React.ElementType; label: string }[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { value: 'list', icon: List, label: 'List view' },
  { value: 'map', icon: Map, label: 'Map view' },
];

/**
 * ViewToggle - Toggle between grid, list, and map views.
 * Features smooth animation and accessible controls.
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex rounded-xl bg-secondary/50 p-1"
      role="radiogroup"
      aria-label="View mode"
    >
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative p-2.5 rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
          >
            {isSelected && (
              <motion.div
                layoutId="view-toggle-bg"
                className="absolute inset-0 bg-primary rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                'relative w-4 h-4 transition-colors',
                isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
