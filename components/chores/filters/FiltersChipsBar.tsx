'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Filters, CATEGORIES, STATUS_OPTIONS } from '../../types';
import { cn } from '@/lib/utils';

interface FiltersChipsBarProps {
  filters: Filters;
  onRemove: (key: keyof Filters, value?: string) => void;
  onClearAll: () => void;
}

/**
 * FiltersChipsBar - A horizontal bar showing active filters as removable chips.
 * Animates chips in/out when filters change.
 */
export function FiltersChipsBar({ filters, onRemove, onClearAll }: FiltersChipsBarProps) {
  const activeFilters: { key: keyof Filters; label: string; value?: string }[] = [];

  // Search query
  if (filters.q) {
    activeFilters.push({ key: 'q', label: `"${filters.q}"` });
  }

  // Categories
  filters.categories?.forEach(catId => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      activeFilters.push({ key: 'categories', label: `${cat.icon} ${cat.label}`, value: catId });
    }
  });

  // Type
  if (filters.type && filters.type !== 'all') {
    activeFilters.push({ key: 'type', label: filters.type === 'online' ? 'Online' : 'Offline' });
  }

  // Budget
  if (filters.minBudget || filters.maxBudget) {
    const min = filters.minBudget || 0;
    const max = filters.maxBudget || 500;
    activeFilters.push({ key: 'minBudget', label: `$${min} - $${max}` });
  }

  // Status
  filters.status?.forEach(statusId => {
    const status = STATUS_OPTIONS.find(s => s.id === statusId);
    if (status) {
      activeFilters.push({ key: 'status', label: status.label, value: statusId });
    }
  });

  // Near Me
  if (filters.nearMe) {
    activeFilters.push({ key: 'nearMe', label: 'Near me' });
  }

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-6 sticky top-20 z-10 py-2 bg-background/80 backdrop-blur-sm"
    >
      <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
      
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
          <motion.button
            key={`${filter.key}-${filter.value || index}`}
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => onRemove(filter.key, filter.value)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
            aria-label={`Remove filter: ${filter.label}`}
          >
            {filter.label}
            <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </AnimatePresence>

      {activeFilters.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClearAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          Clear all
        </motion.button>
      )}
    </motion.div>
  );
}
