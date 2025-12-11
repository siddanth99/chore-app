'use client';

import { useRouter } from 'next/navigation';
import { KeyboardEvent } from 'react';

interface CategoryTileProps {
  name: string;
  icon: React.ReactNode;
  gradient: string;
  count: number;
}

export function CategoryTile({ name, icon, gradient, count }: CategoryTileProps) {
  const router = useRouter();

  const handleClick = () => {
    // TODO: track analytics for category click
    router.push(`/chores?category=${encodeURIComponent(name)}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      className={`group relative overflow-hidden rounded-2xl p-6 ${gradient} transition-all duration-300 hover:scale-105 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full text-left`}
      aria-label={`Browse ${name} category with ${count} jobs available`}
    >
      {/* Icon */}
      <div className="mb-4 text-foreground/90">{icon}</div>
      
      {/* Name */}
      <h3 className="text-lg font-semibold mb-1">{name}</h3>
      
      {/* Count */}
      <p className="text-sm text-foreground/70">
        {count === 0 
          ? '0 chores available' 
          : count === 1 
          ? '1 chore available' 
          : `${count} chores available`}
      </p>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="bg-card/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          See jobs →
        </span>
      </div>
    </button>
  );
}

// Map category names to icons and gradients
const CATEGORY_METADATA: Record<string, { icon: React.ReactNode; gradient: string }> = {
  'Cleaning': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
  },
  'Moving': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20',
  },
  'Repairs': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20',
  },
  'Cooking': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12h18M3 6h18M3 18h18" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-red-500/20 to-pink-500/20',
  },
  'Delivery': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20',
  },
  'Pet Care': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  },
  // Fallback for unknown categories
  'default': {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="13" width="16" height="8" rx="1" />
        <path d="M6 13V5a2 2 0 012-2h8a2 2 0 012 2v8" />
      </svg>
    ),
    gradient: 'bg-gradient-to-br from-gray-500/20 to-slate-500/20',
  },
};

function getCategoryMetadata(name: string) {
  return CATEGORY_METADATA[name] || CATEGORY_METADATA['default'];
}

interface FeaturedCategoriesProps {
  categories?: Array<{ name: string; count: number }>;
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  // Use provided categories if available, otherwise fallback to default hardcoded list
  const displayCategories = categories && categories.length > 0
    ? categories.map(cat => ({
        name: cat.name,
        count: cat.count,
        ...getCategoryMetadata(cat.name),
      }))
    : [
        {
          name: 'Cleaning',
          count: 0,
          ...CATEGORY_METADATA['Cleaning'],
        },
        {
          name: 'Moving',
          count: 0,
          ...CATEGORY_METADATA['Moving'],
        },
        {
          name: 'Repairs',
          count: 0,
          ...CATEGORY_METADATA['Repairs'],
        },
        {
          name: 'Cooking',
          count: 0,
          ...CATEGORY_METADATA['Cooking'],
        },
        {
          name: 'Delivery',
          count: 0,
          ...CATEGORY_METADATA['Delivery'],
        },
        {
          name: 'Pet Care',
          count: 0,
          ...CATEGORY_METADATA['Pet Care'],
        },
      ];

  // Format count text
  const formatCount = (count: number) => {
    if (count === 0) return '0 chores available';
    if (count === 1) return '1 chore available';
    return `${count} chores available`;
  };

  return (
    <section id="categories" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Featured Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find help for any task around your home or office
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayCategories.map((category, index) => (
            <div key={category.name} className={`fade-up fade-up-delay-${(index % 4) + 1}`}>
              <CategoryTile
                name={category.name}
                icon={category.icon}
                gradient={category.gradient}
                count={category.count}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
