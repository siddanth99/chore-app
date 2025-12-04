'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

/**
 * MapPlaceholder - A stylized placeholder for the map view.
 * Shows a decorative map-like interface when map view is selected.
 */
export function MapPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card h-[400px] lg:h-full min-h-[400px] relative overflow-hidden"
    >
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(10)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px bg-foreground"
            style={{ top: `${i * 10}%` }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px bg-foreground"
            style={{ left: `${i * 10}%` }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* Fake map pins */}
      {[
        { x: 25, y: 30 },
        { x: 60, y: 20 },
        { x: 45, y: 55 },
        { x: 75, y: 45 },
        { x: 30, y: 70 },
        { x: 80, y: 75 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          >
            <div className="relative">
              <MapPin className="w-6 h-6 text-primary drop-shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/30 blur-sm" />
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Center user location */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 -m-4 rounded-full bg-accent/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
            <Navigation className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">6 chores nearby</p>
            <p className="text-xs text-muted-foreground">Within 5 miles</p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Expand Map
          </button>
        </div>
      </div>
    </motion.div>
  );
}
