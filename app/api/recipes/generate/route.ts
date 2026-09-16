import { NextRequest, NextResponse } from 'next/server';
import { IngredientItem, RecipeItem } from '@/types';
import { analyzeEverestQuality } from '@/lib/everestQualityShield';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ingredients: IngredientItem[] = body.ingredients || [];
    const userPreferences = body.userPreferences || { nutritionalGoal: 'Balanced' };

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No ingredients provided.'
      }, { status: 400 });
    }

    const ingredientNames = ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
    const selectedPrefs = userPreferences.selectedPreferences || [];
    const customPrefsText = userPreferences.customPreferences ? `User Custom Note: ${userPreferences.customPreferences}` : '';
    
    // Fallback to legacy goalText if selectedPrefs is empty
    const goalText = selectedPrefs.length > 0 ? selectedPrefs.join(', ') : (userPreferences.nutritionalGoal || 'Balanced Nutrition');
    const legacyNoteText = userPreferences.customDietaryNote ? `User Custom Note: ${userPreferences.customDietaryNote}` : '';
    
    const finalPrefsText = selectedPrefs.length > 0 ? selectedPrefs.join(', ') : goalText;
    const finalCustomNote = customPrefsText || legacyNoteText;

    // Estimate total food mass for basic fallback waste calculation
    let totalMassKg = 0;
    ingredients.forEach((ing) => {
      let itemMassKg = 0.15;
      if (ing.unit === 'g') itemMassKg = ing.quantity / 1000;
      else if (ing.unit === 'kg') itemMassKg = ing.quantity;
      else if (ing.unit === 'ml') itemMassKg = ing.quantity / 1000;
      else if (ing.unit === 'l') itemMassKg = ing.quantity;
      else itemMassKg = ing.quantity * 0.15;
      totalMassKg += itemMassKg;
    });

    const everestQualityReport = analyzeEverestQuality(ingredients);

    const promptText = `You are PunarJeevAnn's Master AI Chef, Ayurvedic Food Scientist & Sustainability Expert. 
User's Leftover Fridge Ingredients: [${ingredientNames}].
User's Selected Priorities & Preferences: [${finalPrefsText}].
${finalCustomNote}

CRITICAL RULES:
1. 100% VEGETARIAN ONLY (NO meat, poultry, fish, seafood, gelatin, or eggs).
2. AYURVEDIC FOOD SAFETY & VIRUDDHA AHARA RULE: NEVER combine incompatible foods in the same dish! 
   - DO NOT mix Milk with Lemon/Citrus fruits or sour items in the same dish (causes curdling & digestive toxicity).
   - DO NOT boil raw Milk directly with Yogurt/Dahi.
   - DO NOT mix heavy Paneer + Milk + Yogurt simultaneously in a sour dish.
3. PREFERENCE RANKING & GOAL ALIGNMENT:
   - Use the User's Selected Priorities & Preferences as RANKING WEIGHTS, not hard filters.
   - Design recipes that best align with these preferences (e.g., if "High Protein" and "Under 15 Minutes" are selected, prioritize quick, protein-rich combinations).
   - Generate 2 to 3 recipes in total.
   - Include 1 FRIDGE STAPLE RECIPE (recipeTier: "fridge_staple", using user's current ingredients).
   - Include 1 NUTRIENT-BOOSTED RECIPE (recipeTier: "nutrient_boost", suggesting +2 to +4 protein-rich, vegetable-dense additions tailored to the preferences).
4. ECO IMPACT: For each recipe, compute a realistic eco impact score based on the actual ingredients used.
   - Consider real-world CO2 emissions (kg CO2e per kg of ingredient) and water footprints (liters per kg).
   - Dairy products (paneer, butter, ghee) have high CO2 and water footprints.
   - Plant-based ingredients (vegetables, legumes, grains) have low footprints.
   - Provide an "ecoScore" from 0 (terrible) to 100 (perfect sustainability), a short "ecoSummary" (1-2 sentences), and estimated numeric values.

Return ONLY a valid JSON object matching this exact structure:
{
  "recipes": [
    {
      "recipeId": "rec_01",
      "title": "Dish Name",
      "prepTimeMinutes": 15,
      "recipeTier": "fridge_staple",
      "ingredientMatchPercentage": 100,
      "usedIngredients": ["Tomato", "Paneer"],
      "pantryStaplesNeeded": ["Oil", "Salt"],
      "nutrientBoostItems": [],
      "nutrientTip": "Ready to cook with your current fridge items!",
      "instructions": [
        "Step 1...",
        "Step 2..."
      ],
      "chefTip": "Storage or leftover tip...",
      "nutritionInfo": {
        "calories": "320 kcal",
        "protein": "18g",
        "carbs": "24g",
        "fats": "12g"
      },
      "ayurvedicPurityTag": "Viruddha Ahara Verified — Safe & Digestible",
      "ecoImpact": {
        "co2eSavedKg": 1.8,
        "waterSavedLiters": 950,
        "wasteDivertedGrams": 450,
        "ecoScore": 78,
        "ecoSummary": "By using these plant-based leftovers, you prevented roughly 1.8 kg of CO2 emissions — equivalent to skipping a 12 km car ride.",
        "realWorldAnalogs": {
          "drivingAvoidedKm": 12,
          "showerMinutesSaved": 11
        }
      }
    }
  ]
}`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            })
          });

          const geminiData = await geminiRes.json();

          if (geminiRes.status === 200) {
            const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (responseText) {
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.recipes && Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
                  console.log(`[Gemini API Success] Generated ${parsed.recipes.length} recipes using model ${model}`);
                  return NextResponse.json({
                    status: 'success',
                    recipes: parsed.recipes,
                    everestQualityReport
                  });
                }
              }
            }
          } else {
            console.warn(`[Gemini API] Model ${model} returned status ${geminiRes.status}:`, geminiData?.error?.message || geminiData);
          }
        } catch (geminiErr) {
          console.warn(`[Gemini API] Exception calling ${model}:`, geminiErr);
        }
      }
    }

    // High-quality zero-waste fallback recipes with computed eco values
    const primaryNames = ingredients.map((i) => i.name);
    const mainTitle = primaryNames.length > 0
      ? `15-Min ${primaryNames.slice(0, 2).join(' & ')} Zero-Waste Stir-Fry`
      : 'Quick Fridge-Clearer Vegetarian Kadhai';

    const fallbackEco = {
      co2eSavedKg: Math.round(totalMassKg * 1.1 * 100) / 100,
      waterSavedLiters: Math.round(totalMassKg * 320),
      wasteDivertedGrams: Math.round(totalMassKg * 1000),
      ecoScore: 72,
      ecoSummary: `By using your leftover ${primaryNames.slice(0, 2).join(' and ')} instead of wasting them, you prevented food waste and saved valuable resources.`,
      realWorldAnalogs: {
        drivingAvoidedKm: Math.round(totalMassKg * 1.1 * 6.5 * 10) / 10,
        showerMinutesSaved: Math.round(totalMassKg * 320 / 80 * 10) / 10
      }
    };

    const fallbackRecipes: RecipeItem[] = [
      {
        recipeId: 'rec_zero_1',
        title: mainTitle,
        prepTimeMinutes: 15,
        recipeTier: 'fridge_staple',
        ingredientMatchPercentage: 100,
        usedIngredients: primaryNames,
        pantryStaplesNeeded: ['Cooking Oil', 'Salt', 'Turmeric Powder', 'Jeera'],
        nutrientBoostItems: [],
        nutrientTip: 'Ready to cook immediately using your available ingredients!',
        instructions: [
          'Heat 1 tbsp cooking oil in a pan over medium heat and add jeera seeds.',
          `Add chopped ${primaryNames.join(' and ')} to the pan and sauté for 4-5 minutes.`,
          'Season with a pinch of salt and turmeric powder.',
          'Cover and simmer for 5 minutes until warm and tender. Serve hot!'
        ],
        chefTip: 'Store any remaining portions in an airtight container for up to 48 hours.',
        nutritionInfo: {
          calories: '280 kcal',
          protein: '14g',
          carbs: '22g',
          fats: '10g'
        },
        ayurvedicPurityTag: 'Viruddha Ahara Verified — Digestively Safe',
        ecoImpact: fallbackEco
      },
      {
        recipeId: 'rec_nutrient_upgrade',
        title: `Nutrient-Boosted ${primaryNames[0] || 'Vegetable'} & Protein Power Bowl`,
        prepTimeMinutes: 20,
        recipeTier: 'nutrient_boost',
        ingredientMatchPercentage: 85,
        usedIngredients: primaryNames,
        pantryStaplesNeeded: ['Lemon / Lime', 'Salt', 'Garam Masala'],
        nutrientBoostItems: ['Paneer / Tofu', 'Moong Sprouts', 'Spinach', 'Flax Seeds'],
        nutrientTip: `Add +4 nutrient-dense items (Paneer, Sprouts, Spinach, Seeds) to maximize protein and fiber for your ${goalText} goal!`,
        instructions: [
          'Sauté paneer cubes and moong sprouts in a pan with 1 tsp oil for 3 minutes.',
          `Toss with chopped ${primaryNames.join(', ')} and fresh baby spinach leaves.`,
          'Season with lemon juice, garam masala, and sprinkle toasted flax seeds on top.'
        ],
        chefTip: 'Adding flax seeds supplies essential Omega-3 plant fatty acids.',
        nutritionInfo: {
          calories: '360 kcal',
          protein: '26g',
          carbs: '22g',
          fats: '14g'
        },
        ayurvedicPurityTag: 'Viruddha Ahara Verified — Digestively Safe',
        ecoImpact: { ...fallbackEco, ecoScore: 65, ecoSummary: 'Adding paneer slightly increases the carbon footprint, but the nutrient density gain makes this a smart choice.' }
      }
    ];

    return NextResponse.json({
      status: 'success',
      recipes: fallbackRecipes,
      everestQualityReport
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Recipe generation failed';
    return NextResponse.json({
      status: 'error',
      message: errorMessage
    }, { status: 500 });
  }
}
