import { IngredientCategory } from '@/types';

// Detailed ingredient shelf-life dictionary (in days from current date)
const INGREDIENT_SHELF_LIFE_MAP: Record<string, { days: number; category: IngredientCategory }> = {
  // Dairy & Plant-Milk
  'milk': { days: 4, category: 'Dairy & Plant-Milk' },
  'doodh': { days: 4, category: 'Dairy & Plant-Milk' },
  'paneer': { days: 4, category: 'Dairy & Plant-Milk' },
  'cottage cheese': { days: 4, category: 'Dairy & Plant-Milk' },
  'curd': { days: 7, category: 'Dairy & Plant-Milk' },
  'dahi': { days: 7, category: 'Dairy & Plant-Milk' },
  'yogurt': { days: 7, category: 'Dairy & Plant-Milk' },
  'yoghurt': { days: 7, category: 'Dairy & Plant-Milk' },
  'buttermilk': { days: 4, category: 'Dairy & Plant-Milk' },
  'chaas': { days: 4, category: 'Dairy & Plant-Milk' },
  'cream': { days: 5, category: 'Dairy & Plant-Milk' },
  'malai': { days: 3, category: 'Dairy & Plant-Milk' },
  'butter': { days: 21, category: 'Dairy & Plant-Milk' },
  'makhan': { days: 14, category: 'Dairy & Plant-Milk' },
  'ghee': { days: 180, category: 'Dairy & Plant-Milk' },
  'cheese': { days: 14, category: 'Dairy & Plant-Milk' },
  'cheddar': { days: 30, category: 'Dairy & Plant-Milk' },
  'soy milk': { days: 7, category: 'Dairy & Plant-Milk' },
  'almond milk': { days: 7, category: 'Dairy & Plant-Milk' },
  'oat milk': { days: 7, category: 'Dairy & Plant-Milk' },

  // Vegetables & Greens
  'spinach': { days: 3, category: 'Vegetables & Greens' },
  'palak': { days: 3, category: 'Vegetables & Greens' },
  'coriander': { days: 4, category: 'Vegetables & Greens' },
  'cilantro': { days: 4, category: 'Vegetables & Greens' },
  'dhania': { days: 4, category: 'Vegetables & Greens' },
  'mint': { days: 4, category: 'Vegetables & Greens' },
  'pudina': { days: 4, category: 'Vegetables & Greens' },
  'methi': { days: 3, category: 'Vegetables & Greens' },
  'fenugreek': { days: 3, category: 'Vegetables & Greens' },
  'lettuce': { days: 5, category: 'Vegetables & Greens' },
  'mushroom': { days: 4, category: 'Vegetables & Greens' },
  'khumb': { days: 4, category: 'Vegetables & Greens' },
  'tomato': { days: 7, category: 'Vegetables & Greens' },
  'tomatoes': { days: 7, category: 'Vegetables & Greens' },
  'tamatar': { days: 7, category: 'Vegetables & Greens' },
  'cucumber': { days: 7, category: 'Vegetables & Greens' },
  'kheera': { days: 7, category: 'Vegetables & Greens' },
  'capsicum': { days: 7, category: 'Vegetables & Greens' },
  'shimla mirch': { days: 7, category: 'Vegetables & Greens' },
  'bell pepper': { days: 7, category: 'Vegetables & Greens' },
  'cauliflower': { days: 7, category: 'Vegetables & Greens' },
  'gobi': { days: 7, category: 'Vegetables & Greens' },
  'cabbage': { days: 14, category: 'Vegetables & Greens' },
  'patta gobhi': { days: 14, category: 'Vegetables & Greens' },
  'broccoli': { days: 7, category: 'Vegetables & Greens' },
  'bhindi': { days: 5, category: 'Vegetables & Greens' },
  'okra': { days: 5, category: 'Vegetables & Greens' },
  'ladyfinger': { days: 5, category: 'Vegetables & Greens' },
  'lauki': { days: 7, category: 'Vegetables & Greens' },
  'bottle gourd': { days: 7, category: 'Vegetables & Greens' },
  'brinjal': { days: 6, category: 'Vegetables & Greens' },
  'eggplant': { days: 6, category: 'Vegetables & Greens' },
  'baingan': { days: 6, category: 'Vegetables & Greens' },
  'green peas': { days: 5, category: 'Vegetables & Greens' },
  'matar': { days: 5, category: 'Vegetables & Greens' },
  'green chili': { days: 10, category: 'Vegetables & Greens' },
  'hari mirch': { days: 10, category: 'Vegetables & Greens' },
  'potato': { days: 30, category: 'Vegetables & Greens' },
  'potatoes': { days: 30, category: 'Vegetables & Greens' },
  'aloo': { days: 30, category: 'Vegetables & Greens' },
  'onion': { days: 30, category: 'Vegetables & Greens' },
  'onions': { days: 30, category: 'Vegetables & Greens' },
  'pyaz': { days: 30, category: 'Vegetables & Greens' },
  'garlic': { days: 60, category: 'Vegetables & Greens' },
  'lahsun': { days: 60, category: 'Vegetables & Greens' },
  'ginger': { days: 21, category: 'Vegetables & Greens' },
  'adrak': { days: 21, category: 'Vegetables & Greens' },
  'carrot': { days: 14, category: 'Vegetables & Greens' },
  'gajar': { days: 14, category: 'Vegetables & Greens' },
  'beetroot': { days: 21, category: 'Vegetables & Greens' },
  'sweet potato': { days: 30, category: 'Vegetables & Greens' },
  'shakarkandi': { days: 30, category: 'Vegetables & Greens' },

  // Grains & Bakery
  'bread': { days: 5, category: 'Grains & Rice' },
  'toast': { days: 7, category: 'Grains & Rice' },
  'bun': { days: 4, category: 'Grains & Rice' },
  'pav': { days: 3, category: 'Grains & Rice' },
  'rice': { days: 180, category: 'Grains & Rice' },
  'chawal': { days: 180, category: 'Grains & Rice' },
  'basmati': { days: 180, category: 'Grains & Rice' },
  'atta': { days: 90, category: 'Grains & Rice' },
  'wheat flour': { days: 90, category: 'Grains & Rice' },
  'flour': { days: 90, category: 'Grains & Rice' },
  'maida': { days: 90, category: 'Grains & Rice' },
  'poha': { days: 90, category: 'Grains & Rice' },
  'suji': { days: 90, category: 'Grains & Rice' },
  'sooji': { days: 90, category: 'Grains & Rice' },
  'rava': { days: 90, category: 'Grains & Rice' },
  'oats': { days: 120, category: 'Grains & Rice' },
  'oatmeal': { days: 120, category: 'Grains & Rice' },

  // Legumes & Pulses
  'toor dal': { days: 180, category: 'Legumes & Pulses' },
  'arhar dal': { days: 180, category: 'Legumes & Pulses' },
  'moong dal': { days: 180, category: 'Legumes & Pulses' },
  'chana dal': { days: 180, category: 'Legumes & Pulses' },
  'chana': { days: 180, category: 'Legumes & Pulses' },
  'chickpeas': { days: 180, category: 'Legumes & Pulses' },
  'chole': { days: 180, category: 'Legumes & Pulses' },
  'rajma': { days: 180, category: 'Legumes & Pulses' },
  'kidney beans': { days: 180, category: 'Legumes & Pulses' },
  'besan': { days: 90, category: 'Legumes & Pulses' },
  'gram flour': { days: 90, category: 'Legumes & Pulses' },

  // Fruits
  'banana': { days: 5, category: 'Fruits' },
  'kela': { days: 5, category: 'Fruits' },
  'apple': { days: 14, category: 'Fruits' },
  'seb': { days: 14, category: 'Fruits' },
  'lemon': { days: 21, category: 'Fruits' },
  'nimbu': { days: 21, category: 'Fruits' },
  'lime': { days: 21, category: 'Fruits' },
  'orange': { days: 14, category: 'Fruits' },
  'mango': { days: 5, category: 'Fruits' },
  'aam': { days: 5, category: 'Fruits' },
  'grapes': { days: 7, category: 'Fruits' },
  'angoor': { days: 7, category: 'Fruits' },
  'papaya': { days: 5, category: 'Fruits' },
  'watermelon': { days: 7, category: 'Fruits' },
  'strawberry': { days: 4, category: 'Fruits' },
  'avocado': { days: 5, category: 'Fruits' },

  // Condiments & Spices & Oils
  'oil': { days: 180, category: 'Condiments & Sauces' },
  'mustard oil': { days: 180, category: 'Condiments & Sauces' },
  'ketchup': { days: 90, category: 'Condiments & Sauces' },
  'sauce': { days: 90, category: 'Condiments & Sauces' },
  'soy sauce': { days: 180, category: 'Condiments & Sauces' },
  'vinegar': { days: 365, category: 'Condiments & Sauces' },
  'salt': { days: 730, category: 'Spices & Seasonings' },
  'namak': { days: 730, category: 'Spices & Seasonings' },
  'sugar': { days: 730, category: 'Other Staples' },
  'turmeric': { days: 365, category: 'Spices & Seasonings' },
  'haldi': { days: 365, category: 'Spices & Seasonings' },
  'red chili powder': { days: 180, category: 'Spices & Seasonings' },
  'jeera': { days: 365, category: 'Spices & Seasonings' },
  'cumin': { days: 365, category: 'Spices & Seasonings' },
  'garam masala': { days: 180, category: 'Spices & Seasonings' },

  // Nuts & Seeds
  'cashew': { days: 90, category: 'Nuts & Seeds' },
  'kaju': { days: 90, category: 'Nuts & Seeds' },
  'almond': { days: 120, category: 'Nuts & Seeds' },
  'badam': { days: 120, category: 'Nuts & Seeds' },
  'peanuts': { days: 60, category: 'Nuts & Seeds' },
  'moongphali': { days: 60, category: 'Nuts & Seeds' },
  'walnut': { days: 60, category: 'Nuts & Seeds' },
  'akhrot': { days: 60, category: 'Nuts & Seeds' }
};

export function getLogicalShelfLifeDays(name: string, category?: string): number {
  const lowerName = (name || '').toLowerCase().trim();

  // 1. Direct dictionary match
  if (INGREDIENT_SHELF_LIFE_MAP[lowerName]) {
    return INGREDIENT_SHELF_LIFE_MAP[lowerName].days;
  }

  // 2. Substring match against dictionary keys
  for (const [key, val] of Object.entries(INGREDIENT_SHELF_LIFE_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return val.days;
    }
  }

  // 3. Category fallback rules
  if (category === 'Dairy & Plant-Milk') return 4;
  if (category === 'Vegetables & Greens') return 7;
  if (category === 'Fruits') return 7;
  if (category === 'Grains & Rice') return 90;
  if (category === 'Legumes & Pulses') return 180;
  if (category === 'Spices & Seasonings') return 365;
  if (category === 'Condiments & Sauces') return 90;
  if (category === 'Nuts & Seeds') return 90;

  return 7; // Default safe produce fallback
}

export function calculateLogicalExpiryDate(name: string, category?: string, customDays?: number): string {
  const days = customDays ?? getLogicalShelfLifeDays(name, category);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
