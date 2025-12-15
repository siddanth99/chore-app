/**
 * Chore App - Browse Chores Type Definitions
 * These types define the data structures for the Browse Chores UI components.
 */

export type Chore = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number | null;
  currency?: string;
  type: 'online' | 'offline';
  status: 'published' | 'in_progress' | 'completed';
  paymentStatus?: 'UNPAID' | 'PENDING' | 'FUNDED' | 'REFUNDED';
  location?: string;
  imageUrl?: string | null;
  createdAt: string;
  applications?: number;
  author?: string;
  lat?: number | null;
  lng?: number | null;
};

export type Filters = {
  q?: string;
  categories?: string[];
  type?: 'online' | 'offline' | 'all';
  minBudget?: number | null;
  maxBudget?: number | null;
  status?: string[];
  nearMe?: boolean;
  radius?: number;
  showMap?: boolean;
};

export type SortOption = 'newest' | 'budget_high' | 'budget_low' | 'distance';

export type ViewMode = 'grid' | 'list' | 'map';

export const CATEGORIES = [
  { id: 'gardening', label: 'Gardening', icon: '🌱' },
  { id: 'handyman', label: 'Handyman', icon: '🔧' },
  { id: 'delivery', label: 'Delivery', icon: '📦' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'moving', label: 'Moving', icon: '🚚' },
  { id: 'pet_care', label: 'Pet Care', icon: '🐕' },
  { id: 'tech', label: 'Tech Help', icon: '💻' },
  { id: 'errands', label: 'Errands', icon: '🏃' },
] as const;

export const STATUS_OPTIONS = [
  { id: 'published', label: 'Open', color: 'bg-green-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-highlight' },
  { id: 'completed', label: 'Completed', color: 'bg-muted' },
] as const;
