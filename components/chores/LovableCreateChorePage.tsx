/**
 * Create Chore UI Components (from Lovable prototype)
 * 
 * NOTE: This file was imported from the Lovable prototype.
 * The actual create-chore logic now lives in app/chores/new/chore-form.tsx.
 * We export reusable layout and visual components here.
 * 
 * The default export (CreateChorePage) is kept as a reference only and
 * should NOT be used as an actual route.
 */

'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, Sparkles, Truck, Dog, Wrench, Home, MapPin, Calendar, 
  Upload, X, Image as ImageIcon, DollarSign, Clock, Eye, 
  AlertCircle, CheckCircle, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ============ TYPES ============
export interface ChoreFormData {
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  isPrivate: boolean;
  images: ImageFile[];
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  size: number;
}

// ============ CONSTANTS ============
export const CATEGORIES = [
  { id: 'gardening', label: 'Gardening', icon: Leaf, color: 'text-green-500' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-accent' },
  { id: 'delivery', label: 'Delivery', icon: Truck, color: 'text-highlight' },
  { id: 'dog-walking', label: 'Dog Walking', icon: Dog, color: 'text-primary' },
  { id: 'repairs', label: 'Repairs', icon: Wrench, color: 'text-orange-500' },
  { id: 'home-help', label: 'Home Help', icon: Home, color: 'text-pink-500' },
];

export const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  { id: 'medium', label: 'Medium', color: 'bg-highlight/20 text-highlight-foreground dark:text-highlight' },
  { id: 'high', label: 'High', color: 'bg-destructive/20 text-destructive' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// ============ ANIMATION VARIANTS ============
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
} as const;

export const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6 }
  }
} as const;

// ============ REUSABLE FORM COMPONENTS ============

/**
 * Styled form input with label, icon, and error handling
 */
export function FormInput({ 
  label, 
  error, 
  icon: Icon,
  ...props 
}: React.ComponentProps<'input'> & { 
  label: string; 
  error?: string; 
  icon?: React.ElementType;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium text-foreground">
        {label}
        {props.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input
          {...props}
          className={cn(
            "transition-all duration-200",
            Icon && "pl-10",
            error && "border-destructive focus-visible:ring-destructive",
            props.disabled && "opacity-50 cursor-not-allowed",
            props.className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id={`${props.id}-error`}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Styled textarea with label, character counter, and error handling
 */
export function FormTextArea({ 
  label, 
  error,
  maxLength,
  value,
  ...props 
}: React.ComponentProps<typeof Textarea> & { 
  label: string; 
  error?: string; 
  maxLength?: number;
}) {
  const charCount = typeof value === 'string' ? value.length : 0;
  
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={props.id} className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {maxLength && (
          <span className={cn(
            "text-xs transition-colors",
            charCount > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <Textarea
        {...props}
        value={value}
        className={cn(
          "min-h-[120px] resize-none transition-all duration-200",
          error && "border-destructive focus-visible:ring-destructive",
          props.disabled && "opacity-50 cursor-not-allowed",
          props.className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id={`${props.id}-error`}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * ONLINE/OFFLINE type toggle (segmented control style)
 */
export function ChoreTypeToggle({ 
  value, 
  onChange,
  disabled = false
}: { 
  value: 'ONLINE' | 'OFFLINE'; 
  onChange: (value: 'ONLINE' | 'OFFLINE') => void;
  disabled?: boolean;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        Type <span className="text-destructive">*</span>
      </Label>
      <div className={cn(
        "flex rounded-lg border border-border p-1 bg-muted/50",
        disabled && "opacity-50 pointer-events-none"
      )}>
        {(['ONLINE', 'OFFLINE'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              value === type 
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            aria-pressed={value === type}
          >
            {type === 'ONLINE' ? '🌐 Online' : '📍 Offline'}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 'ONLINE' 
          ? 'Task can be done remotely (e.g., data entry, virtual assistance)'
          : 'Task requires physical presence at a location'}
      </p>
    </motion.div>
  );
}

/**
 * Suggested categories for quick selection
 */
const SUGGESTED_CATEGORIES = [
  'Cleaning',
  'Moving',
  'Gardening',
  'Tech Support',
  'Handyman',
  'Delivery',
  'Dog Walking',
  'Other',
];

/**
 * Category input with suggested presets + custom text input
 * Users can pick from suggestions OR type their own category
 */
export function CategorySelect({ 
  value, 
  onChange,
  disabled = false
}: { 
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedCategory = CATEGORIES.find(c => c.label.toLowerCase() === value.toLowerCase());
  
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Category <span className="text-destructive">*</span>
      </Label>
      
      {/* Suggested category pills */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_CATEGORIES.map((cat) => {
          const isSelected = value.toLowerCase() === cat.toLowerCase();
          const categoryData = CATEGORIES.find(c => c.label.toLowerCase() === cat.toLowerCase());
          
          return (
            <button
              key={cat}
              type="button"
              onClick={() => !disabled && onChange(cat)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background text-foreground border-border hover:bg-accent/10 hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {categoryData && (
                <categoryData.icon className={cn("w-3.5 h-3.5", isSelected ? "" : categoryData.color)} />
              )}
              {cat}
            </button>
          );
        })}
      </div>
      
      {/* Custom category input */}
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or type a custom category..."
          disabled={disabled}
          className={cn(
            "w-full",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {selectedCategory && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <selectedCategory.icon className={cn("w-4 h-4", selectedCategory.color)} />
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Pick a suggested category or enter your own
      </p>
    </motion.div>
  );
}

/**
 * Budget input with currency symbol
 */
export function BudgetInput({ 
  value, 
  onChange,
  disabled = false,
  error
}: { 
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <Label htmlFor="budget" className="text-sm font-medium text-foreground">
        Budget (optional)
      </Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="budget"
          type="number"
          min="0"
          placeholder="Enter amount"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "pl-10",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Image upload zone with preview
 */
export function ImageUploadZone({ 
  imagePreview,
  imageUrl,
  onFileChange,
  onRemove,
  uploading = false,
  disabled = false,
  error
}: { 
  imagePreview: string;
  imageUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = imagePreview || imageUrl;
  
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Image (optional)
      </Label>
      
      {!hasImage ? (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
            "border-border hover:border-primary/50 hover:bg-accent/5",
            (disabled || uploading) && "opacity-50 cursor-not-allowed"
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Click to upload image"
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : (
              <>Drop an image here, or <span className="text-primary font-medium">browse</span></>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, or WebP. Max 5MB.
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <div className="w-full aspect-[16/9]">
            <img
              src={imagePreview || imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/90 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Date/time input styled
 */
export function DateTimeInput({ 
  label,
  value, 
  onChange,
  disabled = false,
  error
}: { 
  label: string;
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <Label htmlFor="dueAt" className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="dueAt"
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "pl-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </motion.div>
  );
}

// ============ LAYOUT COMPONENTS ============

/**
 * Main layout wrapper for Create/Edit Chore page
 * Provides the two-column grid with hero header
 */
export function CreateChoreLayout({ 
  title = "Create a New Chore",
  subtitle = "Post your task and connect with trusted helpers in your area",
  children,
  sidebar
}: { 
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-8 pb-12">
        {/* Animated background shapes */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 right-20 w-40 h-40 rounded-full bg-accent/10 blur-3xl"
        />
        
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid gap-8",
            sidebar ? "lg:grid-cols-[1fr,380px]" : "max-w-3xl mx-auto"
          )}
        >
          {/* Form Column */}
          <motion.div
            variants={cardVariants}
            className="glass-card p-6 sm:p-8"
          >
            {children}
          </motion.div>
          
          {/* Sidebar Column */}
          {sidebar && (
            <div className="hidden lg:block">
              {sidebar}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

/**
 * Preview card showing live form data (for sidebar)
 */
export function ChorePreviewCard({ 
  title,
  description,
  category,
  budget,
  location,
  dueAt,
  imageUrl,
  type
}: { 
  title: string;
  description: string;
  category: string;
  budget: string;
  location?: string;
  dueAt?: string;
  imageUrl?: string;
  type: 'ONLINE' | 'OFFLINE';
}) {
  const categoryData = CATEGORIES.find(c => c.label.toLowerCase() === category.toLowerCase());
  const budgetNum = parseInt(budget) || 0;
  
  return (
    <motion.div
      variants={cardVariants}
      className="glass-card p-5 sticky top-24"
    >
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
      </div>
      
      <motion.div
        layout
        className="rounded-xl border border-border bg-card p-4 space-y-3"
      >
        {/* Image */}
        {imageUrl && (
          <div className="rounded-lg overflow-hidden -mx-1 -mt-1 mb-3 aspect-[16/9]">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-1">
          {title || 'Your Chore Title'}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description || 'Add a description for your chore...'}
        </p>
        
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            type === 'ONLINE' ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
          )}>
            {type === 'ONLINE' ? '🌐' : '📍'} {type}
          </span>
          
          {categoryData && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <categoryData.icon className="w-3 h-3" />
              {categoryData.label}
            </span>
          )}
          
          {budgetNum > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-highlight/10 text-highlight-foreground dark:text-highlight">
              <DollarSign className="w-3 h-3" />
              ${budgetNum}
            </span>
          )}
        </div>
        
        {/* Location & Deadline */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {location && type === 'OFFLINE' && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.substring(0, 30)}{location.length > 30 ? '...' : ''}
            </span>
          )}
          {dueAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(dueAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </motion.div>
      
      {/* Tips */}
      <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
        <h4 className="text-sm font-medium text-accent mb-1">💡 Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Add clear photos to get 3x more responses</li>
          <li>• Be specific about requirements</li>
          <li>• Set a realistic budget and deadline</li>
        </ul>
      </div>
    </motion.div>
  );
}

// ============ REFERENCE-ONLY MAIN COMPONENT ============
// This is kept for reference. The actual form logic is in app/chores/new/chore-form.tsx

export default function CreateChorePage() {
  // This component is NOT used as a route.
  // See app/chores/new/chore-form.tsx for the actual implementation.
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-destructive">Reference Only</h1>
      <p className="text-muted-foreground mt-2">
        This component is not used directly. See <code>app/chores/new/chore-form.tsx</code>
      </p>
    </div>
  );
}
