'use client';

import { BrowseChoresPageEnhanced } from './BrowseChoresPageEnhanced';
import { Chore, Filters } from './types';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import useUserLocation from '@/lib/hooks/useUserLocation';
import { haversineDistanceKm } from '@/lib/utils/distance';

interface BrowseChoresClientProps {
  initialChores: any[]; // Prisma chore objects from server
  initialFilters: Filters;
}

/**
 * BrowseChoresClient - Client wrapper for BrowseChoresPageEnhanced
 * 
 * Transforms server data to browse-v2 format and handles client-side interactions.
 * TODO: Implement URL searchParams sync for filters
 * TODO: Wire up router navigation for onView and onPostChore callbacks
 */
export function BrowseChoresClient({
  initialChores,
  initialFilters,
}: BrowseChoresClientProps) {
  const router = useRouter();

  // Transform Prisma chores to browse-v2 Chore format
  const transformedChores: Chore[] = useMemo(() => {
    return initialChores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      category: chore.category.toLowerCase(),
      budget: chore.budget,
      currency: '$',
      type: chore.type === 'ONLINE' ? 'online' : 'offline',
      status: mapStatus(chore.status),
      location: chore.locationAddress || undefined,
      imageUrl: chore.imageUrl || undefined,
      createdAt: chore.createdAt.toISOString(),
      applications: chore._count?.applications || 0,
      author: chore.createdBy?.name || undefined,
      lat: chore.locationLat || null,
      lng: chore.locationLng || null,
    }));
  }, [initialChores]);

  // User location hook
  const { position: userPos, loading: userLoading, error: userError, requestLocation } = useUserLocation();
  
  // Track if location has been requested
  const [locationRequested, setLocationRequested] = useState(false);

  // Filter chores by radius when nearMe is enabled
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const visibleChores = useMemo(() => {
    if (!filters.nearMe || !userPos || !filters.radius) {
      return transformedChores;
    }

    return transformedChores.filter((chore) => {
      if (typeof chore.lat !== 'number' || typeof chore.lng !== 'number') {
        return false;
      }
      const distance = haversineDistanceKm(
        userPos.lat,
        userPos.lng,
        chore.lat,
        chore.lng
      );
      return distance <= (filters.radius ?? 5);
    });
  }, [transformedChores, filters.nearMe, filters.radius, userPos]);

  // Request location when nearMe is toggled on or map view is selected
  useEffect(() => {
    if ((filters.nearMe || filters.showMap) && !locationRequested && !userPos && !userLoading) {
      setLocationRequested(true);
      requestLocation();
    }
  }, [filters.nearMe, filters.showMap, locationRequested, userPos, userLoading, requestLocation]);

  const handleViewChore = (id: string) => {
    router.push(`/chores/${id}`);
  };

  const handlePostChore = () => {
    router.push('/chores/new');
  };

  return (
    <BrowseChoresPageEnhanced
      chores={visibleChores}
      initialFilters={filters}
      onFiltersChange={setFilters}
      userPosition={userPos}
      userLocationError={userError}
      onViewChore={handleViewChore}
      onPostChore={handlePostChore}
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

