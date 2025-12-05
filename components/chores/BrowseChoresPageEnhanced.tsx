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
import MapPlaceholder from './ui/MapPlaceholder';
import { useRouter } from 'next/navigation';
import { Chore, Filters, SortOption, ViewMode } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { haversineDistanceKm } from '@/lib/utils/distance';
import { priceWithinRange } from '@/lib/utils/filters';

interface BrowseChoresPageEnhancedProps {
  chores?: Chore[] | null;
  visibleChoresInRadius?: Chore[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  clearFilters: () => void;
  userPosition?: { lat: number; lng: number } | null;
  userLocationError?: string | null;
  viewMode: 'map' | 'list' | 'grid';
  setViewMode: (v: 'map'|'list'|'grid') => void;
  onViewChore?: (id: string) => void;
  onPostChore?: () => void;
  categories?: Array<{ id: string; label: string }>;
  serverCategories?: Array<{ id: string; label: string }>;
  initialCount?: number;
  initialTotalCount?: number;
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
  visibleChoresInRadius,
  filters,
  onFiltersChange,
  clearFilters,
  userPosition,
  userLocationError,
  viewMode,
  setViewMode,
  onViewChore: externalOnViewChore,
  onPostChore: externalOnPostChore,
  initialCount = 0,
  initialTotalCount,
  categories,
  serverCategories = categories,
}: BrowseChoresPageEnhancedProps) {
  const router = useRouter();
  const { info } = useToast();

  // Local state
  const [sortBy, setSortBy] = useState<SortOption>('newest');
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

    // Budget filter: use helper function that includes chores with missing price when no filter is active
    result = result.filter(c => priceWithinRange(c, filters?.minBudget ?? null, filters?.maxBudget ?? null));

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
    const updated = { ...filters };
    if (key === 'categories' && value) {
      updated.categories = updated.categories?.filter(c => c !== value);
    } else if (key === 'status' && value) {
      updated.status = updated.status?.filter(s => s !== value);
    } else if (key === 'minBudget' || key === 'maxBudget') {
      updated.minBudget = null;
      updated.maxBudget = null;
    } else {
      (updated as any)[key] = key === 'type' ? 'all' : key === 'nearMe' ? false : '';
    }
    onFiltersChange(updated);
  }, [filters, onFiltersChange]);

  const handleClearAllFilters = useCallback(() => {
    if (clearFilters) {
      clearFilters();
    }
  }, [clearFilters]);

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

  // Keep server-rendered count stable to avoid hydration mismatch:
  // - initialTotalCount is rendered on server
  // - after mount we compute totalCount and update
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // initialTotalCount should come from props (server snapshot)
  const serverCount = initialTotalCount ?? (chores ? chores.length : 0);

  const isLoading = chores === null || chores === undefined;
  const isEmpty = filteredChores?.length === 0;
  // totalCount is the current computed count (client-filtered)
  const totalCount = filteredChores?.length || 0;

  // Display serverCount during SSR / initial client render to avoid mismatch
  // Show server snapshot until client mount to avoid hydration mismatch
  const displayCountText = isLoading
    ? 'Loading...'
    : `${mounted ? totalCount : (initialTotalCount ?? totalCount)} chores available`;
  
  // Currency formatter for Indian Rupees
  const formatINR = (value?: number | string | null) => {
    const v = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (v == null || Number.isNaN(Number(v))) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v));
  };
  
  // Use visibleChoresInRadius for map view, filteredChores for list view
  const visibleChores = viewMode === 'map' ? (visibleChoresInRadius ?? []) : (filteredChores ?? []);
  const visibleCount = visibleChores.length;
  
  // Show toast when radius > 0 and no chores found
  useEffect(() => {
    const KEY = '__NO_CHORES_TOAST_LOCK';
  
    // only run when in map view and no visible chores and user position known
    if (!(viewMode === 'map' && filters.radius && filters.radius > 0 && visibleCount === 0 && userPosition)) {
      // if results appear, reset the global lock so future empty results can show again
      if (typeof window !== 'undefined' && (window as any)[KEY]) {
        (window as any)[KEY] = { snapshot: null, ts: 0 };
      }
      return;
    }
  
    // build a compact snapshot of the relevant filter state
    const snapshot = JSON.stringify({
      radius: filters.radius,
      viewMode,
    });
  
    // ensure global lock object exists
    if (typeof window !== 'undefined' && !(window as any)[KEY]) {
      (window as any)[KEY] = { snapshot: null, ts: 0 };
    }
  
    const global = typeof window !== 'undefined' ? (window as any)[KEY] : { snapshot: null, ts: 0 };
    const now = Date.now();
    const COOLDOWN = 8000; // ms
  
    // If we've already shown for the same snapshot recently, skip
    if (global.snapshot === snapshot && (now - global.ts) < COOLDOWN) {
      return;
    }
  
    const timer = setTimeout(() => {
      try {
        info(
          'No chores found',
          `No chores found within ${filters.radius} km — try increasing radius.`
        );
      } catch (e) {
        // swallow any errors from the toast system
      }
  
      // record that we've shown the toast for this snapshot
      if (typeof window !== 'undefined') {
        (window as any)[KEY] = { snapshot, ts: Date.now() };
      }
    }, 500); // small delay to avoid showing immediately on mount
  
    return () => {
      clearTimeout(timer);
    };
  }, [viewMode, filters.radius, visibleCount, userPosition, info]);
  

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
      // Watch for theme changes
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="pt-8">
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
                    {displayCountText}
                  </span>
                  {!isLoading && (mounted ? totalCount : serverCount) > 0 && (
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
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-1">
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  Tiles
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('map')}
                >
                  Map
                </button>
              </div>
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
                onChange={onFiltersChange}
                viewMode={viewMode}
                clearFilters={clearFilters}
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
                      onChange={onFiltersChange}
                      onClose={() => setIsMobileFilterOpen(false)}
                      isMobile
                      viewMode={viewMode}
                      clearFilters={clearFilters}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 min-h-[500px]">
              {viewMode === "map" ? (
                <>
                  <div className="w-full h-[350px] md:h-[420px]">
                    <MapPlaceholder 
                      chores={visibleChoresInRadius ?? []} 
                      visibleChoresInRadius={visibleChoresInRadius}
                      userPosition={userPosition ?? null} 
                      radius={filters.radius ?? 5} 
                      className="w-full h-full" 
                      isDark={isDark}
                    />
                  </div>
                  
                  {/* Chores list below map */}
                  <div className="mt-4">
                    <h3 className="font-medium mb-3">Chores within {filters.radius ?? 0} km — {visibleChoresInRadius?.length ?? 0}</h3>
                    <ul className="space-y-3">
                      {(!visibleChoresInRadius || visibleChoresInRadius.length === 0) ? (
                        <li className="p-4 text-sm text-muted-foreground text-center">
                          No chores found in this range.
                        </li>
                      ) : (
                        visibleChoresInRadius.map(c => {
                          const dist = userPosition && c.lat && c.lng ? haversineDistanceKm(userPosition.lat, userPosition.lng, c.lat, c.lng) : null;
                          const distanceLabel = dist == null ? '' : dist < 1 ? `${Math.round(dist*1000)} m` : `${dist.toFixed(1)} km`;
                          return (
                            <li 
                              key={c.id} 
                              onClick={() => router.push(`/chores/${c.id}?from=chores&view=${viewMode}`)} 
                              className="cursor-pointer py-3 px-3 rounded-lg bg-card hover:shadow transition-shadow"
                            >
                              <div className="flex justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate">{c.title}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {c.location || 'Location not specified'}
                                    {distanceLabel && <> • {distanceLabel}</>}
                                  </div>
                                </div>
                                <div className="text-right ml-4 flex-shrink-0">
                                  {formatINR(c.budget ?? (c as any).price ?? (c as any).quote ?? (c as any).amount) || '—'}
                                </div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </>
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
                      categories={serverCategories || categories}
                    />
                  ))}
                </div>
              ) : (
                // Grid/Tiles view (default)
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredChores?.map((chore, i) => (
                    <EnhancedChoreCard
                      key={chore.id}
                      chore={chore}
                      view="card"
                      index={i}
                      onView={handleViewChore}
                      categories={serverCategories || categories}
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
