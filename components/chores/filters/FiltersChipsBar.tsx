'use client';

import React, { useEffect, useState } from 'react';
import { Filters, CATEGORIES, STATUS_OPTIONS } from '../types';

interface FiltersChipsBarProps {
  filters: Filters;
  onRemove: (key: keyof Filters, value?: string) => void;
  onClearAll: () => void;
}

type ActiveFilter = {
  key?: string;
  label: string;
  value?: string;
};

/**
 * FiltersChipsBar - A horizontal bar showing active filters as removable chips.
 * Animates chips in/out when filters change.
 */
export function FiltersChipsBar({ filters, onRemove, onClearAll }: FiltersChipsBarProps) {
  // Compute active filters from filters prop
  const activeFilters: ActiveFilter[] = [];

  // Search query
  if (filters.q) {
    activeFilters.push({ key: 'q', label: `"${filters.q}"` });
  }

  // Categories
  filters.categories?.forEach(catId => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      activeFilters.push({ key: 'categories', label: `${cat.icon} ${cat.label}`, value: catId });
    }
  });

  // Type
  if (filters.type && filters.type !== 'all') {
    activeFilters.push({ key: 'type', label: filters.type === 'online' ? 'Online' : 'Offline' });
  }

  // Budget
  if (filters.minBudget || filters.maxBudget) {
    const min = filters.minBudget || 0;
    const max = filters.maxBudget || 500;
    activeFilters.push({ key: 'minBudget', label: `₹${min} - ₹${max}` });
  }

  // Status
  filters.status?.forEach(statusId => {
    const status = STATUS_OPTIONS.find(s => s.id === statusId);
    if (status) {
      activeFilters.push({ key: 'status', label: status.label, value: statusId });
    }
  });

  // Near Me
  if (filters.nearMe) {
    activeFilters.push({ key: 'nearMe', label: 'Near me' });
  }

  if (activeFilters.length === 0) return null;

  // Adapt onRemove to work with removeFilter signature
  const removeFilter = (keyOrLabel: string) => {
    const filter = activeFilters.find(f => (f.key ?? f.label) === keyOrLabel);
    if (filter) {
      onRemove(filter.key as keyof Filters, filter.value);
    }
  };

  // Use stable component for rendering
  return <FiltersChipsBarStable activeFilters={activeFilters} removeFilter={removeFilter} />;
}

/* ---------- stable FiltersChipsBar render (server + client identical DOM) ---------- */

const FiltersChipsBarStable: React.FC<{
  activeFilters: Array<{ label: string; key?: string }>;
  removeFilter: (keyOrLabel: string) => void;
}> = ({ activeFilters, removeFilter }) => {
  // mounted only toggles a class on the client to trigger CSS transitions.
  // The DOM (structure & number of nodes) remains identical on server and client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // base classes always present on server and client
  const containerClassBase =
    'flex flex-wrap items-center gap-2 mb-6 sticky top-20 z-10 py-2 bg-background/80 backdrop-blur-sm';
  // mounted toggles a visual class only
  const mountedClass = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1';
  const containerClass = `${containerClassBase} ${mountedClass}`;

  return (
    <div className={containerClass} aria-hidden="false">
      <span className="text-sm text-muted-foreground mr-2">Active filters:</span>

      {/* Render chips identically on server and client — no conditional adding/removing */}
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.length === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          activeFilters.map((f, i) => {
            const key = f.key ?? `${f.label}-${i}`;
            return (
              <div
                key={key}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-sm transition-transform duration-150"
                role="listitem"
                aria-label={`filter-${key}`}
              >
                <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[10rem]">
                  {f.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeFilter(f.key ?? f.label)}
                  className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted/60"
                  aria-label={`Remove ${f.label}`}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ---------- end stable render ---------- */
