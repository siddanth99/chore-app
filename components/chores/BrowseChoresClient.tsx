'use client';

import { BrowseChoresPageEnhanced } from './BrowseChoresPageEnhanced';
import { Chore, Filters } from './types';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

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
    }));
  }, [initialChores]);

  const handleViewChore = (id: string) => {
    router.push(`/chores/${id}`);
  };

  const handlePostChore = () => {
    router.push('/chores/new');
  };

  return (
    <BrowseChoresPageEnhanced
      chores={transformedChores}
      initialFilters={initialFilters}
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

