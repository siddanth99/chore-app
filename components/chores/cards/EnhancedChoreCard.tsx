'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { Chore, CATEGORIES } from '../types';
import { cn } from '@/lib/utils';
import { normalizeKey, findCategoryByChore, type CategoryItem } from '../utils/category';
import { parsePriceValue } from '@/lib/utils/filters';
import ClientOnlyDate from '@/components/ui/ClientOnlyDate';


// Robust category lookup function
function findCategoryForChore(chore: Chore | null | undefined, categories: CategoryItem[] = []) {
  // categories: [{id, label}, ...]
  // chore.category may be {id,label} or a string id or a label string
  if (!chore) return categories[0] ?? { id: 'uncategorized', label: 'Uncategorized', icon: '📋' };

  // Check for categoryData property first (from transformed chores)
  if ((chore as any).categoryData) {
    const catData = (chore as any).categoryData;
    if (catData && typeof catData === 'object' && catData.id) {
      const found = categories.find(c => c.id === catData.id);
      if (found) return found;
      return {
        id: catData.id,
        label: catData.label ?? catData.name ?? catData.id,
        icon: '📋'
      };
    }
  }

  // if chore.category is object with id (type assertion needed)
  const categoryValue = (chore as any).category;
  if (categoryValue && typeof categoryValue === 'object' && categoryValue.id) {
    const found = categories.find(c => c.id === categoryValue.id);
    return found ?? { 
      id: categoryValue.id, 
      label: categoryValue.label ?? categoryValue.name ?? categoryValue.id,
      icon: '📋'
    };
  }

  // if chore.category is string, try match id first
  if (typeof chore.category === 'string') {
    const byId = categories.find(c => c.id === chore.category);
    if (byId) return byId;

    // try normalize by label
    const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const byLabel = categories.find(c => norm(c.label) === norm(chore.category));
    if (byLabel) return byLabel;
  }

  return categories[0] ?? { id: 'uncategorized', label: 'Uncategorized', icon: '📋' };
}

interface EnhancedChoreCardProps {
  chore: Chore;
  view?: 'card' | 'compact';
  index?: number;
  onView?: (id: string) => void;
  categories?: CategoryItem[];
}

/**
 * EnhancedChoreCard - A beautiful, animated chore card with hover effects.
 * Features smooth tilt animation, shimmering highlight, and micro-interactions.
 */
export function EnhancedChoreCard({
  chore,
  view = 'card',
  index = 0,
  onView,
  categories: propCategories,
}: EnhancedChoreCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  // Use propCategories if provided, otherwise fallback to CATEGORIES
  const categoriesList: CategoryItem[] = propCategories && propCategories.length > 0
    ? propCategories.map(c => ({
        id: c.id,
        label: c.label,
        icon: typeof c.icon === 'string' ? c.icon : (c.icon || '📋'),
      }))
    : CATEGORIES.map(c => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
      }));

  // Use robust category lookup
  const category = findCategoryForChore(chore, categoriesList);
  const statusLabel = chore.status === 'published' ? 'Open' : chore.status === 'in_progress' ? 'In Progress' : 'Done';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onView) {
      onView(chore.id);
    }
  };

  if (view === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:border-primary/30 transition-all"
        onClick={() => onView?.(chore.id)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-labelledby={`chore-compact-${chore.id}`}
      >
        {/* Thumbnail or Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{typeof category.icon === 'string' ? category.icon : category.icon ? <category.icon className="w-5 h-5" /> : '📋'}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 id={`chore-compact-${chore.id}`} className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {chore.title}
          </h4>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {chore.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {chore.location}
              </span>
            )}
            <span>
              <ClientOnlyDate isoDate={chore.createdAt} mode="relative" />
            </span>
          </div>
        </div>

        {/* Budget & Action */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-accent/20 text-accent font-semibold text-sm">
            {formatPrice(chore, chore.currency)}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(chore.id);
            }}
          >
            Bid
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onView?.(chore.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-labelledby={`chore-${chore.id}`}
      className="glass-card overflow-hidden cursor-pointer group relative"
    >
      {/* Shimmer highlight on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full pointer-events-none"
        animate={{ translateX: isHovered ? '200%' : '-100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Image Section */}
      {chore.imageUrl ? (
        <div className="relative h-40 overflow-hidden">
          <motion.img
            src={chore.imageUrl}
            alt={chore.title}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          
          {/* Category Badge on Image */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm font-medium flex items-center gap-1.5">
              {typeof category.icon === 'string' ? <span>{category.icon}</span> : category.icon ? <category.icon className="w-4 h-4" /> : <span>📋</span>}
              {category.label}
            </span>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              chore.status === 'published' && 'bg-green-500/90 text-white',
              chore.status === 'in_progress' && 'bg-highlight text-highlight-foreground',
              chore.status === 'completed' && 'bg-muted text-muted-foreground'
            )}>
              {statusLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/10 to-highlight/10 relative flex items-center justify-center">
          <span className="text-4xl opacity-50">{typeof category.icon === 'string' ? category.icon : category.icon ? <category.icon className="w-8 h-8" /> : '📋'}</span>
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm font-medium flex items-center gap-1.5">
              {typeof category.icon === 'string' ? <span>{category.icon}</span> : category.icon ? <category.icon className="w-4 h-4" /> : <span>📋</span>}
              {category.label}
            </span>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              chore.status === 'published' && 'bg-green-500/90 text-white',
              chore.status === 'in_progress' && 'bg-highlight text-highlight-foreground',
              chore.status === 'completed' && 'bg-muted text-muted-foreground'
            )}>
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <h3
          id={`chore-${chore.id}`}
          className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors"
        >
          {chore.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {chore.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {chore.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {chore.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <ClientOnlyDate isoDate={chore.createdAt} mode="relative" />
          </span>
          {chore.applications !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {chore.applications}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Budget */}
          <span className="px-4 py-1.5 rounded-full bg-accent/20 text-accent font-bold text-sm">
            {formatPrice(chore, chore.currency)}
          </span>

          {/* Type Badge */}
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            chore.type === 'online'
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary text-secondary-foreground'
          )}>
            {chore.type === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Hover CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-2 pt-2"
        >
          <span className="text-sm font-medium text-primary">View Details</span>
          <ArrowRight className="w-4 h-4 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function formatPrice(chore: any, currency: string = '₹'): string {
  const v = parsePriceValue(chore);
  if (v == null) return '—';
  // Use INR formatting for Indian Rupees, otherwise use simple format
  if (currency === '₹' || currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  }
  return `${currency}${v}`;
}
