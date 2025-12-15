'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { Chore, CATEGORIES } from '../types';
import { cn } from '@/lib/utils';
import { normalizeKey, findCategoryByChore, type CategoryItem } from '../utils/category';
import { parsePriceValue } from '@/lib/utils/filters';
import ClientOnlyDate from '@/components/ui/ClientOnlyDate';
import { getCategoryIcon } from '../categories';


// Robust category lookup function
function findCategoryForChore(chore: Chore | null | undefined, categories: CategoryItem[] = []): { id: string; label: string; icon: string } {
  // categories: [{id, label}, ...]
  // chore.category may be {id,label} or a string id or a label string
  let categoryLabel = 'Uncategorized';
  let categoryId = 'uncategorized';

  if (!chore) {
    return { id: categoryId, label: categoryLabel, icon: getCategoryIcon(categoryLabel) };
  }

  // Check for categoryData property first (from transformed chores)
  if ((chore as any).categoryData) {
    const catData = (chore as any).categoryData;
    if (catData && typeof catData === 'object' && catData.id) {
      const found = categories.find(c => c.id === catData.id);
      if (found) {
        return { id: found.id, label: found.label, icon: getCategoryIcon(found.label) };
      }
      categoryLabel = catData.label ?? catData.name ?? catData.id;
      categoryId = catData.id;
      return { id: categoryId, label: categoryLabel, icon: getCategoryIcon(categoryLabel) };
    }
  }

  // if chore.category is object with id (type assertion needed)
  const categoryValue = (chore as any).category;
  if (categoryValue && typeof categoryValue === 'object' && categoryValue.id) {
    const found = categories.find(c => c.id === categoryValue.id);
    if (found) {
      return { id: found.id, label: found.label, icon: getCategoryIcon(found.label) };
    }
    categoryLabel = categoryValue.label ?? categoryValue.name ?? categoryValue.id;
    categoryId = categoryValue.id;
    return { id: categoryId, label: categoryLabel, icon: getCategoryIcon(categoryLabel) };
  }

  // if chore.category is string, try match id first
  if (typeof chore.category === 'string') {
    const byId = categories.find(c => c.id === chore.category);
    if (byId) {
      return { id: byId.id, label: byId.label, icon: getCategoryIcon(byId.label) };
    }

    // try normalize by label
    const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const byLabel = categories.find(c => norm(c.label) === norm(chore.category));
    if (byLabel) {
      return { id: byLabel.id, label: byLabel.label, icon: getCategoryIcon(byLabel.label) };
    }
    
    // Use the category string as label and get icon for it
    categoryLabel = chore.category;
    categoryId = normalizeKey(chore.category);
    return { id: categoryId, label: categoryLabel, icon: getCategoryIcon(categoryLabel) };
  }

  const fallback = categories[0];
  if (fallback) {
    return { id: fallback.id, label: fallback.label, icon: getCategoryIcon(fallback.label) };
  }

  return { id: categoryId, label: categoryLabel, icon: getCategoryIcon(categoryLabel) };
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
        icon: typeof c.icon === 'string' ? c.icon : (c.icon || getCategoryIcon(c.label)),
      }))
    : CATEGORIES.map(c => ({
        id: c.id,
        label: c.label,
        icon: getCategoryIcon(c.label),
      }));

  // Use robust category lookup (returns {id, label, icon} with icon as string emoji)
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
        className="w-full rounded-lg border border-border bg-background p-3 md:p-4 shadow-sm hover:shadow transition-all cursor-pointer group"
        onClick={() => onView?.(chore.id)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-labelledby={`chore-compact-${chore.id}`}
      >
        <div className="flex items-start gap-3 md:gap-4">
          {/* Thumbnail or Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg md:text-xl">{category.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 id={`chore-compact-${chore.id}`} className="font-semibold text-sm md:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {chore.title}
              </h4>
              <span className="px-2 md:px-3 py-1 rounded-full bg-accent/20 text-accent font-semibold text-xs md:text-sm flex-shrink-0">
                {formatPrice(chore, chore.currency)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
              {chore.location && (
                <span className="flex items-center gap-1 truncate max-w-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{chore.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <ClientOnlyDate isoDate={chore.createdAt} mode="relative" />
              </span>
              {category.label && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] md:text-xs">
                  {category.icon} {category.label}
                </span>
              )}
            </div>
          </div>
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
        <div className="relative h-32 md:h-40 overflow-hidden">
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
              <span>{category.icon}</span>
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
        <div className="h-24 md:h-32 bg-gradient-to-br from-primary/10 via-accent/10 to-highlight/10 relative flex items-center justify-center">
          <span className="text-4xl opacity-50">{category.icon}</span>
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm font-medium flex items-center gap-1.5">
              <span>{category.icon}</span>
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
      <div className="p-3 md:p-5 space-y-3 md:space-y-4">
        {/* Title */}
        <h3
          id={`chore-${chore.id}`}
          className="font-bold text-base md:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors"
        >
          {chore.title}
        </h3>

        {/* Description */}
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
          {chore.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
          {chore.location && (
            <span className="flex items-center gap-1 truncate max-w-full">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
              <span className="truncate">{chore.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
            <ClientOnlyDate isoDate={chore.createdAt} mode="relative" />
          </span>
          {chore.applications !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
              {chore.applications}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-border/50 gap-2">
          {/* Budget */}
          <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-accent/20 text-accent font-bold text-xs md:text-sm">
            {formatPrice(chore, chore.currency)}
          </span>

          <div className="flex items-center gap-2">
            {/* Payment Status Badge */}
            {chore.paymentStatus && (
              <span className={cn(
                'px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0',
                chore.paymentStatus === 'FUNDED' && 'bg-green-500/20 text-green-600 dark:text-green-400',
                chore.paymentStatus === 'PENDING' && 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
                chore.paymentStatus === 'UNPAID' && 'bg-red-500/20 text-red-600 dark:text-red-400',
                chore.paymentStatus === 'REFUNDED' && 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              )}>
                {chore.paymentStatus === 'FUNDED' && 'Paid ✔'}
                {chore.paymentStatus === 'PENDING' && 'Payment Pending...'}
                {chore.paymentStatus === 'UNPAID' && 'Unpaid'}
                {chore.paymentStatus === 'REFUNDED' && 'Refunded'}
              </span>
            )}

            {/* Type Badge */}
            <span className={cn(
              'px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium flex-shrink-0',
              chore.type === 'online'
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-secondary-foreground'
            )}>
              {chore.type === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
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
