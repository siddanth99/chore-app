// app/page.tsx
import LandingPage from '@/components/landing/LandingPage';
import { listPublishedChoresWithFilters } from '@/server/api/chores';
import type { ChoreCardProps } from '@/components/landing/ChoreCard';

export const metadata = {
  title: 'Chore App — Home',
  description: 'Post chores, receive bids from local workers, and get it done.',
};

// Revalidate every 60 seconds for fresh data
export const revalidate = 60;

export default async function Home() {
  // TODO: replace with more specific server helper if needed
  // Fetch published chores server-side
  let chores: ChoreCardProps[] = [];
  
  try {
    const rawChores = await listPublishedChoresWithFilters({}, undefined);
    
    // Transform to ChoreCardProps format, limit to 6
    chores = rawChores.slice(0, 6).map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      category: chore.category,
      budget: chore.budget,
      locationAddress: chore.locationAddress,
      applicationsCount: chore._count?.applications ?? 0,
      createdAt: chore.createdAt.toISOString(),
      urgent: false, // TODO: Add urgent field to chore model if needed
    }));
  } catch (error) {
    console.error('[Home] Failed to fetch chores:', error);
    // Fallback to empty array - will show empty state
  }

  return <LandingPage chores={chores} />;
}
