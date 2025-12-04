'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedEmptyStateProps {
  onClearFilters?: () => void;
  onPostChore?: () => void;
}

/**
 * EnhancedEmptyState - A beautiful empty state with animated illustration.
 * Shows when no chores match the current filters.
 */
export function EnhancedEmptyState({ onClearFilters, onPostChore }: EnhancedEmptyStateProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handlePostChore = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    onPostChore?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Animated Illustration */}
      <div className="relative w-48 h-48 mb-8">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Main circle */}
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          {/* Inner content */}
          <div className="relative">
            <Search className="w-16 h-16 text-muted-foreground" />
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg">?</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <h3 className="text-xl font-bold text-foreground mb-2">No chores found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        We couldn't find any chores matching your filters. Try adjusting your search or post a new chore!
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="gap-2"
        >
          <Search className="w-4 h-4" />
          Clear Filters
        </Button>
        
        <div className="relative">
          <Button
            onClick={handlePostChore}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Post a Chore
          </Button>

          {/* Confetti Animation */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: ['#4F46E5', '#06B6D4', '#FBBF24', '#FB7185'][i % 4],
                    }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 200,
                      y: (Math.random() - 0.5) * 200,
                      scale: [0, 1, 0],
                      rotate: Math.random() * 360,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                ))}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <Sparkles className="w-8 h-8 text-highlight" />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
