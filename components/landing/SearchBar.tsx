'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const categoryChips = [
  { label: 'Cleaning', icon: '🧹' },
  { label: 'Lawn Care', icon: '🌿' },
  { label: 'Moving', icon: '📦' },
  { label: 'Handyman', icon: '🔧' },
  { label: 'Assembly', icon: '🪑' },
];

const suggestions = [
  'Mount a TV on the wall',
  'Deep clean my apartment',
  'Help with moving boxes',
];

export function SearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [location, setLocation] = React.useState('');

  const handleCategoryClick = (category: string) => {
    // TODO: track analytics for popular category click
    router.push(`/chores?category=${encodeURIComponent(category)}`);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategoryClick(category);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // TODO: track analytics for suggestion click
    setSearchQuery(suggestion);
    // TODO: optionally auto-submit search
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent, suggestion: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSuggestionClick(suggestion);
    }
  };

  const handleSearch = () => {
    // TODO: track analytics for search submit
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    router.push(`/chores${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-6 sm:p-8 max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="What do you need done?"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                aria-label="Search for chores"
              />
            </div>
            <div className="relative sm:w-48">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Location"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                aria-label="Location"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Search for chores"
            >
              Search
            </button>
          </div>

          {/* Category Chips */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-3">Popular categories:</p>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Popular categories">
              {categoryChips.map((chip) => (
                <button
                  key={chip.label}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => handleCategoryClick(chip.label)}
                  onKeyDown={(e) => handleCategoryKeyDown(e, chip.label)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 border border-border/50 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Browse chores: ${chip.label}`}
                >
                  <span aria-hidden="true">{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Try:</p>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Search suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
                  aria-label={`Search for: ${suggestion}`}
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

