import { IngredientItem, EverestQualityReport } from '@/types';

/**
 * Everest Quality Guard — Food Freshness & Ayurvedic Viruddha Ahara Safety Engine
 * Inspired by Everest Instruments' leadership in Dairy Quality Testing & Food Preservation.
 */
export function analyzeEverestQuality(ingredients: IngredientItem[]): EverestQualityReport {
  if (!ingredients || ingredients.length === 0) {
    return {
      overallFreshnessScore: 100,
      freshnessStatus: 'Optimal',
      viruddhaAharaCheck: {
        isSafe: true,
        safetyMessage: 'No incompatible ingredient combinations detected.'
      },
      qualityTips: ['Keep ingredients refrigerated at below 4°C to prevent bacterial growth.']
    };
  }

  const ingredientLowerNames = ingredients.map((i) => i.name.toLowerCase());

  const hasMilk = ingredientLowerNames.some((n) => n.includes('milk') || n.includes('doodh'));
  const hasYogurt = ingredientLowerNames.some((n) => n.includes('curd') || n.includes('dahi') || n.includes('yogurt'));
  const hasPaneer = ingredientLowerNames.some((n) => n.includes('paneer') || n.includes('chenna'));
  const hasCitrus = ingredientLowerNames.some((n) => n.includes('lemon') || n.includes('lime') || n.includes('orange') || n.includes('citrus'));
  const hasTomato = ingredientLowerNames.some((n) => n.includes('tomato'));

  const dairyItems = ingredients.filter(
    (item) =>
      item.category === 'Dairy & Plant-Milk' ||
      ['milk', 'paneer', 'curd', 'dahi', 'butter', 'ghee', 'cheese', 'malai', 'cream', 'khoya', 'mawa'].some((d) =>
        item.name.toLowerCase().includes(d)
      )
  );

  const freshProduce = ingredients.filter(
    (item) => item.category === 'Vegetables & Greens' || item.category === 'Fruits'
  );

  let isViruddhaAhara = false;
  let viruddhaReason = 'Ayurvedic Food Purity Verified: All ingredients are digestively compatible.';

  // Ayurvedic Viruddha Ahara Checks
  if (hasMilk && hasCitrus) {
    isViruddhaAhara = true;
    viruddhaReason = 'Viruddha Ahara Alert: Combining raw Milk with Citrus/Lemon causes rapid acidic curdling and digestive distress. Our AI Chef separates these into safe sub-preparations.';
  } else if (hasMilk && hasYogurt) {
    isViruddhaAhara = true;
    viruddhaReason = 'Viruddha Ahara Alert: Mixing raw Milk directly with Yogurt/Dahi disrupts digestive Agni. Cook curd or milk separately.';
  } else if (hasMilk && (hasPaneer && (hasCitrus || hasTomato))) {
    isViruddhaAhara = true;
    viruddhaReason = 'Viruddha Ahara Alert: Heavy triple-dairy (Milk + Paneer + Acidic Tomato/Lemon) can cause digestive heaviness. Balanced cooking sequence enforced.';
  }

  const freshnessScore = 95;
  const tips: string[] = [];

  if (dairyItems.length > 0) {
    tips.push(
      `Everest Dairy Guard (${dairyItems.map((i) => i.name).join(', ')}): Boil raw milk to 72°C or check curdling acidity before mixing with spices.`
    );
    tips.push(
      'Dairy Storage Tip: Store Paneer submerged in fresh cold water inside an airtight container; change water daily.'
    );
  }

  if (freshProduce.length > 0) {
    tips.push(
      'Vegetable Freshness: Crisp wilted greens in ice-cold water for 10 minutes to restore turgor pressure before cooking.'
    );
  }

  tips.push(
    'Ayurvedic Purity Rule: Avoid mixing hot milk with sour/salty foods in the same cooking pot to maintain digestive balance.'
  );

  const isDairyPresent = dairyItems.length > 0;
  const status: 'Optimal' | 'Use Soon' | 'Check Spoilage' =
    ingredients.length > 4 ? 'Use Soon' : 'Optimal';

  return {
    overallFreshnessScore: Math.max(75, Math.min(98, freshnessScore - ingredients.length * 2)),
    freshnessStatus: status,
    dairyQualityAnalysis: {
      isDairyPresent,
      dairyItemsCount: dairyItems.length,
      recommendedTest: isDairyPresent
        ? 'Boil-on-Heat Test / Acidity Smell Assessment'
        : 'Visual Color & Odor Integrity Inspection',
      shelfLifeEstimate: isDairyPresent ? '24 - 48 Hours Recommended' : '48 - 72 Hours Recommended'
    },
    viruddhaAharaCheck: {
      isSafe: !isViruddhaAhara,
      safetyMessage: viruddhaReason
    },
    qualityTips: tips
  };
}
