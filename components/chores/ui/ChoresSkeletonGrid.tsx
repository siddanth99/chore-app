'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ChoresSkeletonGridProps {
  count?: number;
  view?: 'grid' | 'list';
}

/**
 * ChoresSkeletonGrid - Animated skeleton loading cards.
 * Displays shimmering placeholder cards while chores are loading.
 */
export function ChoresSkeletonGrid({ count = 6, view = 'grid' }: ChoresSkeletonGridProps) {
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="w-20 h-8 rounded-full" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-card overflow-hidden"
        >
          {/* Image skeleton with shimmer */}
          <div className="relative h-40 bg-muted overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          </div>

          {/* Content skeleton */}
          <div className="p-5 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
