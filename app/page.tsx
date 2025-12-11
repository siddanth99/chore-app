// app/page.tsx
import LandingPage from '@/components/landing/LandingPage';
import { listPublishedChoresWithFilters } from '@/server/api/chores';
import { getCategoriesWithCounts } from '@/server/api/categories';
import type { ChoreCardProps } from '@/components/landing/ChoreCard';

export const metadata = {
  title: 'Chore App — Home',
  description: 'Post chores, receive bids from local workers, and get it done.',
};

// Revalidate every 60 seconds for fresh data
export const revalidate = 60;

export default async function Home() {
  // Fetch published chores and categories with counts in parallel
  let chores: ChoreCardProps[] = [];
  let categories: Array<{ name: string; count: number }> = [];
  
  try {
    const [rawChores, categoriesWithCounts] = await Promise.all([
      listPublishedChoresWithFilters({}, undefined),
      getCategoriesWithCounts(false), // Only published chores
    ]);
    
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

    // Transform categories with counts, take first 6
    categories = categoriesWithCounts.slice(0, 6).map(c => ({
      name: c.name,
      count: c.count,
    }));
  } catch (error) {
    console.error('[Home] Failed to fetch data:', error);
    // Fallback to empty arrays - will show empty states
  }

  return <LandingPage chores={chores} categories={categories} />;
}
