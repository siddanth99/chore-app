/**
 * Filter utility functions for chores
 */

/**
 * Parse price value from a chore object, checking multiple possible fields
 */
export function parsePriceValue(chore: any): number | null {
  const val = Number(chore?.price ?? chore?.budget ?? chore?.quote ?? chore?.amount);
  if (Number.isFinite(val) && !Number.isNaN(val)) {
    return val;
  }
  return null;
}

/**
 * Check if a chore's price is within the specified range.
 * If no budget constraints are provided, includes chores with missing price.
 */
export function priceWithinRange(
  chore: any,
  min?: number | null,
  max?: number | null
): boolean {
  const price = parsePriceValue(chore); // number | null
  
  // If both min and max are null/undefined or min <= 0 && !max, return true for all chores (including ones where parsed price is null)
  if ((min == null || min <= 0) && (max == null || Number.isNaN(max))) return true;
  
  // If price is null, include chores with no price unless user explicitly set min>0
  if (price == null) return true;
  
  // Apply min/max filters only when price exists
  if (min != null && price < min) return false;
  if (max != null && price > max) return false;
  return true;
}

