'use client';

import { BrowseChoresPageEnhanced } from './BrowseChoresPageEnhanced';
import { Chore, Filters } from './types';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import useUserLocation from '@/lib/hooks/useUserLocation';
import { haversineDistanceKm } from '@/lib/utils/distance';
import { priceWithinRange } from '@/lib/utils/filters';
import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'choreflow_filters_v1';
const VIEW_KEY = 'choreflow_view_v1';

const DEFAULT_FILTERS: Filters = {
  q: '',
  categories: [],
  type: 'all',
  minBudget: 0,
  maxBudget: 10000,
  status: [],
  nearMe: false,
  radius: 5,
  showMap: false,
};

interface BrowseChoresClientProps {
  initialChores: any[]; // Prisma chore objects from server
  initialFilters: Filters;
  initialCategories?: Array<{ id: string; label: string }>;
  initialCount?: number;
  initialTotalCount?: number;
}

/**
 * BrowseChoresClient - Client wrapper for BrowseChoresPageEnhanced
 *
 * Transforms server data to browse-v2 format and handles client-side interactions.
 * TODO: Implement URL searchParams sync for filters
 * TODO: Wire up router navigation for onView and onPostChore callbacks
 */
export function BrowseChoresClient(props: BrowseChoresClientProps) {
  const router = useRouter();

  /**
   * Important: initialize state from server props only.
   * Do NOT read localStorage or window during initial render — only from useEffect.
   */
  const initialViewFromProps = (props.initialFilters as any)?.view ?? 'grid';

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>(() => initialViewFromProps);

  const isInitialMount = React.useRef(true);

  // Filters: derive initial filters directly from props (server snapshot)
  const [filters, setFilters] = useState(() => {
    // clone to avoid accidental mutation
    return { ...(props.initialFilters || {}), radius: props.initialFilters?.radius ?? 5 };
  });

  // chores: start with server snapshot, but update when props change (from router.refresh())
  const [chores, setChores] = useState(() => props.initialChores ?? []);
  
  // Update chores when initialChores prop changes (from server re-render after filter change)
  useEffect(() => {
    if (props.initialChores) {
      setChores(props.initialChores);
    }
  }, [props.initialChores]);

  // Transform Prisma chores to browse-v2 Chore format
  const transformedChores: Chore[] = useMemo(() => {
    return chores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      category:
        typeof chore.category === 'string'
          ? chore.category.toLowerCase()
          : chore.category?.id || chore.category?.label || 'uncategorized',
      budget: chore.budget,
      currency: '₹',
      type: chore.type === 'ONLINE' ? 'online' : 'offline',
      status: mapStatus(chore.status),
      location: chore.locationAddress || undefined,
      imageUrl: chore.imageUrl || undefined,
      createdAt: chore.createdAt.toISOString(),
      applications: chore._count?.applications || 0,
      author: chore.createdBy?.name || undefined,
      lat: chore.locationLat || null,
      lng: chore.locationLng || null,
      // Preserve original category data if it's an object
      categoryData: typeof chore.category === 'object' ? chore.category : undefined,
    }));
  }, [chores]);

  // Compute categories from chores payload (server snapshot)
  const categoriesFromChores = React.useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    (props.initialChores || []).forEach((c) => {
      if (!c) return;
      // assume c.category may be object or string; normalize:
      if (typeof c.category === 'object' && c.category?.id) {
        map.set(c.category.id, {
          id: c.category.id,
          label: c.category.label ?? c.category.name ?? c.category.id,
        });
      } else if (typeof c.category === 'string') {
        // If backend stores id string only, we may not have label — use id as label for now
        const normalized = c.category.toLowerCase().trim();
        if (!map.has(normalized)) {
          map.set(normalized, { id: normalized, label: c.category });
        }
      }
    });
    return Array.from(map.values());
  }, [props.initialChores]);

  // User location hook
  const { position: userPos, loading: userLoading, error: userError, requestLocation } = useUserLocation();

  // Persisted view/filters sync should run after mount only
  useEffect(() => {
    // Now that we are mounted, we can safely read localStorage and sync
    try {
      const storedFiltersRaw =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (storedFiltersRaw) {
        const storedFilters = JSON.parse(storedFiltersRaw);
        // Only apply stored filters if they actually differ (avoid unnecessary rerender)
        setFilters((prev) => ({ ...prev, ...(storedFilters || {}) }));
      }
      const storedView = typeof window !== 'undefined' ? localStorage.getItem(VIEW_KEY) : null;
      if (storedView && (storedView === 'grid' || storedView === 'list' || storedView === 'map')) {
        // update viewMode on client after mount (this will not cause hydration mismatch)
        setViewMode(storedView);
      }
    } catch (e) {
      // fail silently — do not change the server-provided initial render
      console.warn('BrowseChoresClient: localStorage sync failed', e);
    }
  }, []);

  // Save filters and view changes to localStorage after they happen (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      localStorage.setItem(VIEW_KEY, viewMode);
    } catch (e) {
      console.warn('BrowseChoresClient: failed to persist filters', e);
    }
  }, [filters, viewMode]);

  // Update URL when viewMode or filters change and trigger server re-render if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Track if this is the initial mount to avoid navigation on first render
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    try {
      const params = new URLSearchParams();
      
      // Add view mode
      params.set('view', viewMode === 'grid' ? 'tiles' : viewMode);
      
      // Add search query
      if (filters.q) {
        params.set('q', filters.q);
      }
      
      // Add categories (as array)
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(cat => {
          params.append('categories', cat);
        });
      }
      
      // Add type
      if (filters.type && filters.type !== 'all') {
        params.set('type', filters.type === 'online' ? 'ONLINE' : 'OFFLINE');
      }
      
      // Add budget filters
      if (filters.minBudget) {
        params.set('minBudget', filters.minBudget.toString());
      }
      if (filters.maxBudget) {
        params.set('maxBudget', filters.maxBudget.toString());
      }
      
      // Add status (as array)
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => {
          params.append('status', status);
        });
      }
      
      // Add nearMe/location filters if applicable
      if (filters.nearMe && userPos) {
        params.set('workerLat', userPos.lat.toString());
        params.set('workerLng', userPos.lng.toString());
        if (filters.radius) {
          params.set('distanceKm', filters.radius.toString());
        }
      }
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      
      // Update URL without triggering navigation
      window.history.replaceState({}, '', newUrl);
      
      // Trigger server refresh to get new data based on updated filters
      router.refresh();
    } catch (e) {
      // ignore URL update errors
    }
  }, [filters, viewMode, userPos, router]);

  // Clear filters function
  function clearFilters() {
    const reset = { ...DEFAULT_FILTERS, radius: 5 };
    setFilters(reset);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  // Request location whenever near-me or map view is active
  useEffect(() => {
    if (filters.nearMe || viewMode === 'map') {
      if (!userPos && !userLoading) {
        requestLocation();
      }
    }
  }, [filters.nearMe, viewMode, userPos, userLoading, requestLocation]);

  const handleViewChore = (id: string) => {
    router.push(`/chores/${id}`);
  };

  const handlePostChore = () => {
    router.push('/chores/new');
  };

  // Create chore list with transformed coordinates
  const choresWithCoords = useMemo(() => {
    return transformedChores.map((c) => ({
      ...c,
      lat: c.lat ?? null,
      lng: c.lng ?? null,
    }));
  }, [transformedChores]);

  // compute filtered chores on the client using chores + filters (this uses stable chores state initialized from server)
  const filteredChores = useMemo(() => {
    // Apply price filtering
    let result = choresWithCoords.filter((c) =>
      priceWithinRange(c, filters?.minBudget ?? null, filters?.maxBudget ?? null),
    );

    // Apply other filters (search, category, type, status, etc.)
    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
      );
    }

    if (filters.categories?.length) {
      // Category is always a string in the Chore type (normalized to lowercase in transformedChores)
      // Filter categories are IDs (like "cleaning"), chore.category is already normalized
      // Normalize both for comparison
      result = result.filter((c) => {
        const choreCategory = (c.category || '').toLowerCase().trim();
        
        return filters.categories!.some(filterCat => {
          const filterCategoryNormalized = filterCat.toLowerCase().trim();
          // Match if exact match or if chore category contains filter category or vice versa
          return choreCategory === filterCategoryNormalized ||
                 choreCategory.includes(filterCategoryNormalized) ||
                 filterCategoryNormalized.includes(choreCategory);
        });
      });
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((c) => c.type === filters.type);
    }

    if (filters.status?.length) {
      result = result.filter((c) => filters.status!.includes(c.status));
    }

    return result;
  }, [choresWithCoords, filters]);

  // Compute visible chores within radius
  const visibleChoresInRadius = useMemo(() => {
    const r = Number(filters.radius ?? 0);
    if (!userPos || r <= 0) return filteredChores;
    const uLat = userPos.lat,
      uLng = userPos.lng;
    return filteredChores.filter(
      (c) =>
        c.lat != null &&
        c.lng != null &&
        haversineDistanceKm(uLat, uLng, c.lat, c.lng) <= r + 0.0001,
    );
  }, [filteredChores, filters.radius, userPos]);

  // Merge server categories from chores with initialCategories prop
  const serverCategories = useMemo(() => {
    const merged = new Map<string, { id: string; label: string }>();
    // Add categories from chores first
    categoriesFromChores.forEach((cat) => merged.set(cat.id, cat));
    // Add initialCategories (from API) if not already present
    (props.initialCategories || []).forEach((cat) => {
      if (!merged.has(cat.id)) {
        merged.set(cat.id, cat);
      }
    });
    return Array.from(merged.values());
  }, [categoriesFromChores, props.initialCategories]);

  // --- "No chores found" toast - only show when filters are intentionally applied ---
  
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const previousChoresCount = useRef<number | null>(null);
  const filtersAppliedRef = useRef(false);

  // Track when filters change via Apply button
  useEffect(() => {
    // Reset the applied flag when filters actually change from user action
    // This will be set to true when Apply is clicked in mobile filters
    // For desktop, filters apply immediately so we don't need special handling
  }, [filters]);

  // Show toast only when filters were intentionally applied and result is empty
  useEffect(() => {
    // Only show toast if we're in map view with radius filtering
    if (viewMode !== 'map' || !filters.radius || filters.radius <= 0) {
      return;
    }

    const currentCount = visibleChoresInRadius?.length ?? 0;
    
    // Only show toast if:
    // 1. Filters were intentionally applied (hasAppliedFilters or filtersAppliedRef)
    // 2. Current count is 0
    // 3. Previous count was > 0 (transitioned from some to none)
    // OR it's the first time checking after applying filters
    if (hasAppliedFilters || filtersAppliedRef.current) {
      if (currentCount === 0) {
        const shouldShow = previousChoresCount.current === null || 
                          (previousChoresCount.current !== null && previousChoresCount.current > 0);
        
        if (shouldShow) {
          toast(`No chores found within ${filters.radius} km — try increasing radius.`, {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
      }
      
      // Reset the flag after showing toast once
      if (currentCount === 0) {
        setHasAppliedFilters(false);
        filtersAppliedRef.current = false;
      }
    }
    
    previousChoresCount.current = currentCount;
  }, [visibleChoresInRadius, viewMode, filters.radius, hasAppliedFilters]);

  // Expose function to mark filters as applied (for mobile Apply button)
  const handleFiltersApplied = useCallback(() => {
    setHasAppliedFilters(true);
    filtersAppliedRef.current = true;
  }, []);

  // Create a wrapper for onFiltersChange that can track Apply button clicks
  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f as typeof filters);
    // Don't set hasAppliedFilters here - only when Apply button is clicked
    // Desktop filters update live, mobile uses Apply button
  }, []);

  return (
    <BrowseChoresPageEnhanced
      chores={filteredChores}
      visibleChoresInRadius={visibleChoresInRadius}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      clearFilters={clearFilters}
      userPosition={userPos}
      userLocationError={userError}
      viewMode={viewMode}
      setViewMode={setViewMode}
      onViewChore={handleViewChore}
      onPostChore={handlePostChore}
      categories={serverCategories}
      initialCount={props.initialCount}
      initialTotalCount={props.initialChores?.length ?? 0}
      onFiltersApplied={handleFiltersApplied}
    />
  );
}

// Map Prisma ChoreStatus to browse-v2 status format
function mapStatus(status: string): 'published' | 'in_progress' | 'completed' {
  switch (status) {
    case 'PUBLISHED':
      return 'published';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'in_progress';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'published';
  }
}