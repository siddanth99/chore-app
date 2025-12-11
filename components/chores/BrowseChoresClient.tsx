'use client';

import { BrowseChoresPageEnhanced } from './BrowseChoresPageEnhanced';
import { Chore, Filters } from './types';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState, useRef } from 'react';
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

  // --- robust "No chores found" guard ---

  // constants
  const NO_CHORES_TOAST_GLOBAL_KEY = '__CHORE_NO_TOAST_GLOBAL';
  const TOAST_COOLDOWN_MS = 5000; // minimal cooldown between toasts for same filter
  const TOAST_DURATION_MS = 6000;

  // keep last filters snapshot so we only show again when filters actually change
  const lastNoChoresFilterRef = useRef<string | null>(null);
  // timestamp of last shown toast
  const lastNoChoresShownAt = useRef<number | null>(null);

  // ensure global guard exists
  if (
    typeof window !== 'undefined' &&
    !(window as any)[NO_CHORES_TOAST_GLOBAL_KEY]
  ) {
    (window as any)[NO_CHORES_TOAST_GLOBAL_KEY] = { showingFor: null, ts: 0 };
  }

  useEffect(() => {
    const empty =
      Array.isArray(visibleChoresInRadius) && visibleChoresInRadius.length === 0;

    // serialize the important parts of filters that determine result
    // choose only the keys that affect the results (radius, categories, q, type, status, nearMe)
    const filtersSnapshot = JSON.stringify({
      radius: filters.radius,
      categories: filters.categories || [],
      q: filters.q || '',
      type: filters.type || 'all',
      status: filters.status || [],
      nearMe: !!filters.nearMe,
    });

    const now = Date.now();
    const global =
      typeof window !== 'undefined'
        ? (window as any)[NO_CHORES_TOAST_GLOBAL_KEY]
        : { showingFor: null, ts: 0 };

    if (empty) {
      const lastShown = lastNoChoresShownAt.current ?? 0;

      // only show if:
      // - this filtersSnapshot differs from the one that last produced a toast (prevents rerenders)
      // - AND cooldown has elapsed since last show (prevents rapid repeat)
      if (
        lastNoChoresFilterRef.current !== filtersSnapshot ||
        now - lastShown > TOAST_COOLDOWN_MS
      ) {
        // if a global toast for chores is currently showing for the same snapshot, don't create another
        if (
          global.showingFor === filtersSnapshot &&
          now - global.ts < TOAST_DURATION_MS + 1000
        ) {
          // there is already a global toast for this same filter; skip
        } else {
          // show toast with stable id to help toast library dedupe
          const toastId = `no-chores-${btoa(filtersSnapshot).slice(0, 12)}`; // unique-ish per filters
          toast(`No chores found within ${filters.radius} km — try increasing radius.`, {
            id: toastId,
            icon: 'ℹ️',
            duration: TOAST_DURATION_MS,
          });
          lastNoChoresFilterRef.current = filtersSnapshot;
          lastNoChoresShownAt.current = now;
          // update global guard
          if (typeof window !== 'undefined') {
            (window as any)[NO_CHORES_TOAST_GLOBAL_KEY] = {
              showingFor: filtersSnapshot,
              ts: now,
            };
          }
        }
      }
    } else {
      // results exist — dismiss any toasts for the previous snapshot(s)
      try {
        // attempt to dismiss the specific last toast id if we created it
        if (lastNoChoresFilterRef.current) {
          const toastId = `no-chores-${btoa(
            lastNoChoresFilterRef.current,
          ).slice(0, 12)}`;
          toast.dismiss(toastId);
        }
        // reset refs & global state
        lastNoChoresFilterRef.current = null;
        lastNoChoresShownAt.current = null;
        if (typeof window !== 'undefined') {
          (window as any)[NO_CHORES_TOAST_GLOBAL_KEY] = { showingFor: null, ts: 0 };
        }
      } catch (e) {
        // ignore errors
      }
    }
    // only depend on visibleChoresInRadius and the specific filter keys we serialized
  }, [
    visibleChoresInRadius,
    filters.radius,
    // ✅ FIX: these are now single entries, not spread arrays
    JSON.stringify(filters.categories ?? []),
    filters.q,
    filters.type,
    JSON.stringify(filters.status ?? []),
    filters.nearMe,
  ]);

  return (
    <BrowseChoresPageEnhanced
      chores={filteredChores}
      visibleChoresInRadius={visibleChoresInRadius}
      filters={filters}
      onFiltersChange={(f: Filters) => setFilters(f as typeof filters)}
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