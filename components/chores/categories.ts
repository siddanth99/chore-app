// Centralized popular categories list for suggestions and dropdowns
export const POPULAR_CATEGORIES = [
  'Cleaning',
  'Moving',
  'Repairs',
  'Cooking',
  'Delivery',
  'Pet Care',
  'Groceries & Errands',
  'Laundry & Ironing',
  'Furniture Assembly',
  'Electrical Work',
  'Plumbing',
  'Painting',
  'Gardening',
  'Tutoring',
  'Driving',
  'Office Help',
];

// Icon/emoji mapping for categories
export const CATEGORY_ICONS: Record<string, string> = {
  'Cleaning': '✨',
  'Moving': '📦',
  'Repairs': '🔧',
  'Cooking': '👨‍🍳',
  'Delivery': '🚚',
  'Pet Care': '🐕',
  'Groceries & Errands': '🛒',
  'Laundry & Ironing': '🧺',
  'Furniture Assembly': '🪑',
  'Electrical Work': '⚡',
  'Plumbing': '🔩',
  'Painting': '🎨',
  'Gardening': '🌱',
  'Tutoring': '📚',
  'Driving': '🚗',
  'Office Help': '💼',
};

// Helper to get icon for a category name
export function getCategoryIcon(categoryName: string): string {
  // Direct match
  if (CATEGORY_ICONS[categoryName]) {
    return CATEGORY_ICONS[categoryName];
  }
  
  // Case-insensitive match
  const normalized = categoryName.toLowerCase().trim();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.toLowerCase() === normalized) {
      return icon;
    }
  }
  
  // Partial match for common variations
  if (normalized.includes('clean')) return '✨';
  if (normalized.includes('move')) return '📦';
  if (normalized.includes('repair') || normalized.includes('fix')) return '🔧';
  if (normalized.includes('cook') || normalized.includes('food')) return '👨‍🍳';
  if (normalized.includes('deliver')) return '🚚';
  if (normalized.includes('pet') || normalized.includes('dog') || normalized.includes('cat')) return '🐕';
  if (normalized.includes('grocery') || normalized.includes('errand')) return '🛒';
  if (normalized.includes('laundry') || normalized.includes('wash')) return '🧺';
  if (normalized.includes('furniture') || normalized.includes('assembly')) return '🪑';
  if (normalized.includes('electric')) return '⚡';
  if (normalized.includes('plumb')) return '🔩';
  if (normalized.includes('paint')) return '🎨';
  if (normalized.includes('garden') || normalized.includes('lawn')) return '🌱';
  if (normalized.includes('tutor') || normalized.includes('teach')) return '📚';
  if (normalized.includes('driv') || normalized.includes('car')) return '🚗';
  if (normalized.includes('office')) return '💼';
  
  // Default fallback
  return '📋';
}

