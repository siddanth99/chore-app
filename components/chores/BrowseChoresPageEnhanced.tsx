'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plus, Sparkles } from 'lucide-react';
import { ChoreFiltersSidebar } from './filters/ChoreFiltersSidebar';
import { EnhancedChoreCard } from './cards/EnhancedChoreCard';
import { SortDropdown } from './ui/SortDropdown';
import { EnhancedEmptyState } from './ui/EnhancedEmptyState';
import { ChoresSkeletonGrid } from './ui/ChoresSkeletonGrid';
import { FiltersChipsBar } from './filters/FiltersChipsBar';
import { ViewToggle } from './ui/ViewToggle';
import { MapPlaceholder } from './ui/MapPlaceholder';
import { Chore, Filters, SortOption, ViewMode } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BrowseChoresPageEnhancedProps {
  chores?: Chore[] | null;
  initialFilters?: Filters;
  theme?: 'light' | 'dark';
  onFiltersChange?: (filters: Filters) => void;
  userPosition?: { lat: number; lng: number } | null;
  userLocationError?: string | null;
  onViewChore?: (id: string) => void;
  onPostChore?: () => void;
}

/**
 * BrowseChoresPageEnhanced - A visually rich, animated Browse Chores page.
 * 
 * Features:
 * - Sticky filter sidebar (becomes drawer on mobile)
 * - Grid/List/Map view toggle
 * - Animated card entrance
 * - Filter chips bar
 * - Sort dropdown
 * - Loading skeletons and empty state
 * 
 * Usage:
 * ```tsx
 * <BrowseChoresPageEnhanced
 *   chores={fetchedChores}
 *   initialFilters={{ categories: ['cleaning'] }}
 *   theme="dark"
 * />
 * ```
 * 
 * TODO: Replace chores prop with server-fetched data from app/chores/page.tsx
 */
export function BrowseChoresPageEnhanced({
  chores,
  initialFilters = {},
  theme: initialTheme = 'light',
  onFiltersChange,
  userPosition,
  userLocationError,
  onViewChore: externalOnViewChore,
  onPostChore: externalOnPostChore,
}: BrowseChoresPageEnhancedProps) {

  // Filter state
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter and sort chores
  const filteredChores = useMemo(() => {
    if (!chores) return null;

    let result = [...chores];

    // Apply filters
    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q)
      );
    }

    if (filters.categories?.length) {
      result = result.filter(c => 
        filters.categories!.includes(c.category.toLowerCase())
      );
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter(c => c.type === filters.type);
    }

    if (filters.minBudget) {
      result = result.filter(c => c.budget && c.budget >= filters.minBudget!);
    }

    if (filters.maxBudget) {
      result = result.filter(c => c.budget && c.budget <= filters.maxBudget!);
    }

    if (filters.status?.length) {
      result = result.filter(c => filters.status!.includes(c.status));
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'budget_high':
        result.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'budget_low':
        result.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
    }

    return result;
  }, [chores, filters, sortBy]);

  const handleRemoveFilter = useCallback((key: keyof Filters, value?: string) => {
    setFilters(prev => {
      if (key === 'categories' && value) {
        return { ...prev, categories: prev.categories?.filter(c => c !== value) };
      }
      if (key === 'status' && value) {
        return { ...prev, status: prev.status?.filter(s => s !== value) };
      }
      if (key === 'minBudget' || key === 'maxBudget') {
        return { ...prev, minBudget: null, maxBudget: null };
      }
      return { ...prev, [key]: key === 'type' ? 'all' : key === 'nearMe' ? false : '' };
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({ q: '', categories: [], type: 'all', minBudget: null, maxBudget: null, status: [], nearMe: false });
  }, []);

  const handleViewChore = useCallback((id: string) => {
    if (externalOnViewChore) {
      externalOnViewChore(id);
    } else {
      // TODO: router.push(`/chores/${id}`)
      console.log('View chore:', id);
    }
  }, [externalOnViewChore]);

  const handlePostChore = useCallback(() => {
    if (externalOnPostChore) {
      externalOnPostChore();
    } else {
      // TODO: router.push('/chores/new')
      console.log('Post new chore');
    }
  }, [externalOnPostChore]);

  const isLoading = chores === null || chores === undefined;
  const isEmpty = filteredChores?.length === 0;
  const totalCount = filteredChores?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="pt-20">
        {/* Hero Header */}
        <section className="relative overflow-hidden py-8 sm:py-12">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />

          <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl font-bold text-foreground"
                >
                  Browse Chores
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <span className="text-muted-foreground">
                    {isLoading ? 'Loading...' : `${totalCount} chores available`}
                  </span>
                  {!isLoading && totalCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      New
                    </motion.span>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={handlePostChore}
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-glow"
                >
                  <Plus className="w-4 h-4" />
                  Post a Chore
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 text-sm font-medium"
              aria-label="Open filters"
            >
              <Menu className="w-4 h-4" />
              Filters
            </button>

            <div className="flex-1" />

            {/* View Toggle & Sort */}
            <div className="flex items-center gap-3">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Filters Chips Bar */}
          <FiltersChipsBar
            filters={filters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />

          {/* Two-column Layout */}
          <div className={cn(
            'flex gap-8',
            viewMode === 'map' && 'flex-col lg:flex-row'
          )}>
            {/* Sidebar (Desktop) */}
            <div className="hidden lg:block flex-shrink-0">
              <ChoreFiltersSidebar
                filters={filters}
                onChange={setFilters}
              />
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {isMobileFilterOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-y-0 left-0 w-80 max-w-[90vw] z-50 lg:hidden"
                  >
                    <ChoreFiltersSidebar
                      filters={filters}
                      onChange={setFilters}
                      onClose={() => setIsMobileFilterOpen(false)}
                      isMobile
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {viewMode === 'map' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MapPlaceholder />
                  <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                      <ChoresSkeletonGrid count={4} view="list" />
                    ) : isEmpty ? (
                      <EnhancedEmptyState
                        onClearFilters={handleClearAllFilters}
                        onPostChore={handlePostChore}
                      />
                    ) : (
                      filteredChores?.map((chore, i) => (
                        <EnhancedChoreCard
                          key={chore.id}
                          chore={chore}
                          view="compact"
                          index={i}
                          onView={handleViewChore}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : isLoading ? (
                <ChoresSkeletonGrid count={6} view={viewMode === 'list' ? 'list' : 'grid'} />
              ) : isEmpty ? (
                <EnhancedEmptyState
                  onClearFilters={handleClearAllFilters}
                  onPostChore={handlePostChore}
                />
              ) : viewMode === 'list' ? (
                <div className="space-y-4">
                  {filteredChores?.map((chore, i) => (
                    <EnhancedChoreCard
                      key={chore.id}
                      chore={chore}
                      view="compact"
                      index={i}
                      onView={handleViewChore}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredChores?.map((chore, i) => (
                    <EnhancedChoreCard
                      key={chore.id}
                      chore={chore}
                      view="card"
                      index={i}
                      onView={handleViewChore}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BrowseChoresPageEnhanced;
