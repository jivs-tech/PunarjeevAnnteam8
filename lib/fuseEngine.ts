import {
  VEGETARIAN_INGREDIENTS_DATASET,
  VegetarianIngredientEntry
} from '@/data/vegetarianIngredients';
import { IngredientItem, MetricUnit, IngredientCategory } from '@/types';

export interface ProcessedInputResult {
  ingredient: IngredientItem;
  wasCorrected: boolean;
  matchedEntry?: VegetarianIngredientEntry;
}

/**
 * Processes raw user input without fuzzy auto-correcting item names.
 * Capitalizes user input and matches dataset entries by exact name/alias
 * for populating default metric units and categories.
 */
export function processRawInput(
  rawName: string,
  userQty?: number,
  userUnit?: MetricUnit,
  userCategory?: IngredientCategory
): ProcessedInputResult {
  const trimmed = rawName.trim();
  if (!trimmed) {
    const emptyItem: IngredientItem = {
      id: 'ing_' + Math.random().toString(36).substring(2, 9),
      name: '',
      rawInputText: '',
      quantity: userQty || 1,
      unit: userUnit || 'pcs',
      category: userCategory || 'Other Staples',
      isAutoCorrected: false,
      source: 'manual'
    };
    return { ingredient: emptyItem, wasCorrected: false };
  }

  // Capitalize first letter of typed name; preserve exact user string (no auto-correct substitution)
  const finalName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // Exact dataset match (case-insensitive) by name or alias to retrieve standard defaults if present
  const lower = trimmed.toLowerCase();
  const matchedEntry = VEGETARIAN_INGREDIENTS_DATASET.find(
    (entry) =>
      entry.name.toLowerCase() === lower ||
      entry.aliases.some((alias) => alias.toLowerCase() === lower)
  );

  // Determine Quantity
  const finalQty = userQty && userQty > 0 ? userQty : 1;

  // Determine Metric Unit
  let finalUnit: MetricUnit = 'pcs';
  if (userUnit) {
    finalUnit = userUnit;
  } else if (matchedEntry) {
    finalUnit = matchedEntry.defaultUnit;
  }

  // Determine Category
  let finalCategory: IngredientCategory = 'Other Staples';
  if (userCategory) {
    finalCategory = userCategory;
  } else if (matchedEntry) {
    finalCategory = matchedEntry.category;
  }

  const ingredientItem: IngredientItem = {
    id: 'ing_' + Math.random().toString(36).substring(2, 9),
    name: finalName,
    rawInputText: trimmed,
    quantity: finalQty,
    unit: finalUnit,
    category: finalCategory,
    isAutoCorrected: false,
    source: 'manual'
  };

  return {
    ingredient: ingredientItem,
    wasCorrected: false,
    matchedEntry
  };
}

/**
 * Autocomplete / suggestion list for search input dropdowns
 */
export function getSuggestions(query: string, limit = 5): VegetarianIngredientEntry[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  return VEGETARIAN_INGREDIENTS_DATASET.filter(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      entry.aliases.some((alias) => alias.toLowerCase().includes(q))
  ).slice(0, limit);
}
