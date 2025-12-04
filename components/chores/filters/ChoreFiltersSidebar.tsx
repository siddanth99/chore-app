'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, SlidersHorizontal } from 'lucide-react';
import { Filters, CATEGORIES, STATUS_OPTIONS } from '../types';
import RangeSlider from '@/components/ui/RangeSlider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoreFiltersSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

/**
 * ChoreFiltersSidebar - A sticky, glass-panel filter sidebar with animated interactions.
 * Features keyword search, category chips, type toggle, budget slider, and status checkboxes.
 */
export function ChoreFiltersSidebar({
  filters,
  onChange,
  onClose,
  isMobile = false,
}: ChoreFiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleCategory = (categoryId: string) => {
    const current = localFilters.categories || [];
    const updated = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId];
    updateFilter('categories', updated);
  };

  const toggleStatus = (statusId: string) => {
    const current = localFilters.status || [];
    const updated = current.includes(statusId)
      ? current.filter(s => s !== statusId)
      : [...current, statusId];
    updateFilter('status', updated);
  };

  const handleApply = () => {
    onChange(localFilters);
    if (isMobile && onClose) onClose();
  };

  const handleClear = () => {
    const cleared: Filters = { q: '', categories: [], type: 'all', minBudget: null, maxBudget: null, status: [], nearMe: false };
    setLocalFilters(cleared);
    onChange(cleared);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'glass-card p-5 space-y-6',
        isMobile ? 'w-full h-full overflow-y-auto' : 'sticky top-24 w-72 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide'
      )}
      aria-label="Filter chores"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filters</h3>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          animate={{ scale: localFilters.q ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Search className="w-4 h-4" />
        </motion.div>
        <input
          type="text"
          placeholder="Search chores..."
          value={localFilters.q || ''}
          onChange={(e) => updateFilter('q', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          aria-label="Search chores"
        />
        <AnimatePresence>
          {localFilters.q && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => updateFilter('q', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Category Chips */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = localFilters.categories?.includes(category.id);
            return (
              <motion.button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary/70 text-secondary-foreground hover:bg-secondary'
                )}
                aria-pressed={isSelected}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Type Toggle (Segmented Control) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground">Type</label>
        <div className="flex rounded-xl bg-secondary/50 p-1">
          {(['all', 'online', 'offline'] as const).map((type) => (
            <button
              key={type}
              onClick={() => updateFilter('type', type)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                localFilters.type === type
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {type === 'all' ? 'All' : type === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Slider */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="budget-range-slider">
          Budget Range
        </label>
        <div className="relative">
          {/* Visual histogram background */}
          <div className="absolute inset-x-0 bottom-0 h-8 flex items-end justify-between gap-0.5 opacity-20" aria-hidden="true">
            {[3, 5, 8, 12, 10, 7, 4, 6, 9, 11, 8, 5].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t"
                style={{ height: `${height * 6}%` }}
              />
            ))}
          </div>
          <RangeSlider
            value={[localFilters.minBudget ?? 0, localFilters.maxBudget ?? 5000]}
            min={0}
            max={100000}
            step={100}
            onChange={(v) => {
              updateFilter('minBudget', v[0]);
              updateFilter('maxBudget', v[1]);
            }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground" role="status" aria-live="polite">
          <span aria-label="Minimum budget">${localFilters.minBudget || 0}</span>
          <span aria-label="Maximum budget">${localFilters.maxBudget || 5000}</span>
        </div>
      </div>

      {/* Status Checkboxes */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground">Status</label>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((status) => {
            const isChecked = localFilters.status?.includes(status.id);
            return (
              <label
                key={status.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center',
                    isChecked
                      ? 'bg-primary border-primary'
                      : 'border-border group-hover:border-primary/50'
                  )}
                  onClick={() => toggleStatus(status.id)}
                >
                  <AnimatePresence>
                    {isChecked && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-3 h-3 text-primary-foreground"
                        viewBox="0 0 12 12"
                      >
                        <path
                          fill="currentColor"
                          d="M10.28 2.28L4.5 8.06 1.72 5.28a1 1 0 00-1.44 1.44l3.5 3.5a1 1 0 001.44 0l6.5-6.5a1 1 0 00-1.44-1.44z"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <span className={cn(
                  'text-sm transition-colors',
                  isChecked ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {status.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Near Me Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">Near me</span>
        </div>
        <Switch
          checked={localFilters.nearMe || false}
          onCheckedChange={(checked) => updateFilter('nearMe', checked)}
          aria-label="Filter by location near me"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={handleClear}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          onClick={handleApply}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          Apply Filters
        </Button>
      </div>
    </motion.aside>
  );
}
