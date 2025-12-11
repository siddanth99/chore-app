'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCategoryIcon } from '../chores/categories';

export interface ChoreCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number | null;
  locationAddress?: string | null;
  applicationsCount?: number;
  createdAt?: string | Date;
  urgent?: boolean;
}

export function ChoreCard({ 
  id,
  title, 
  description, 
  category, 
  budget,
  locationAddress,
  applicationsCount = 0,
  urgent 
}: ChoreCardProps) {
  const titleId = `chore-title-${id}`;
  
  return (
    <Link href={`/chores/${id}`}>
      <article
        className="glass-card card-hover p-5 cursor-pointer group h-full"
        role="article"
        aria-labelledby={titleId}
        data-chore-id={id}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            <span>{getCategoryIcon(category)}</span>
            {category}
          </span>
          {urgent && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Urgent
            </span>
          )}
        </div>

        {/* Title */}
        <h3 
          id={titleId}
          className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors"
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            {/* Location */}
            {locationAddress && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate max-w-[80px]">{locationAddress}</span>
              </span>
            )}
            {/* Applications count */}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              {applicationsCount} {applicationsCount === 1 ? 'bid' : 'bids'}
            </span>
          </div>
          {/* Budget */}
          {budget != null && (
            <span className="text-lg font-bold text-primary">₹{budget}</span>
          )}
        </div>
      </article>
    </Link>
  );
}

// Props for the FeaturedChores section
export interface FeaturedChoresProps {
  chores: ChoreCardProps[];
}

export function FeaturedChores({ chores }: FeaturedChoresProps) {
  const router = useRouter();

  const handleViewAllChores = () => {
    // TODO: track analytics for view all chores click
    router.push('/chores');
  };

  return (
    <section className="py-16 sm:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 fade-up">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Featured Chores</h2>
            <p className="text-lg text-muted-foreground">
              Browse tasks in your area and start earning
            </p>
          </div>
          <button
            onClick={handleViewAllChores}
            className="mt-4 sm:mt-0 text-primary font-medium hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View all chores →
          </button>
        </div>

        {chores.length === 0 ? (
          <EmptyChoresState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chores.map((chore, index) => (
              <div key={chore.id} className={`fade-up fade-up-delay-${(index % 4) + 1}`}>
                <ChoreCard {...chore} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyChoresState() {
  const router = useRouter();
  
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path d="M12 12v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">No chores available yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Be the first to post a chore and get help from local workers in your area.
      </p>
      <button
        onClick={() => router.push('/chores/new')}
        className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Post a Chore
        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
