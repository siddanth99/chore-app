/**
 * Category utility functions for robust category matching
 */

export function normalizeKey(s: string | undefined | null): string {
  return (s ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string | React.ElementType;
}

/**
 * Find category by chore's raw category value
 * Tries: exact id match, normalized id, normalized label, includes match
 */
export function findCategoryByChore(
  choreCategoryRaw: string | undefined | null,
  categoriesList: CategoryItem[]
): CategoryItem | null {
  if (!choreCategoryRaw || categoriesList.length === 0) {
    return categoriesList[0] || null;
  }

  const normalized = normalizeKey(choreCategoryRaw);

  // Try exact id match
  const byId = categoriesList.find(c => c.id === normalized);
  if (byId) return byId;

  // Try normalized id match
  const byNormalizedId = categoriesList.find(c => normalizeKey(c.id) === normalized);
  if (byNormalizedId) return byNormalizedId;

  // Try normalized label match
  const byNormalizedLabel = categoriesList.find(c => normalizeKey(c.label) === normalized);
  if (byNormalizedLabel) return byNormalizedLabel;

  // Try includes match (normalized)
  const byIncludes = categoriesList.find(
    c => 
      normalizeKey(c.label).includes(normalized) || 
      normalized.includes(normalizeKey(c.label))
  );
  if (byIncludes) return byIncludes;

  // Fallback to first category
  return categoriesList[0] || null;
}

