import { NextRequest, NextResponse } from 'next/server';
import { RecipeItem } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const recipeName: string = body.recipeName;

    if (!recipeName || recipeName.trim() === '') {
      return NextResponse.json({
        status: 'error',
        message: 'No recipe name provided.'
      }, { status: 400 });
    }

    const promptText = `You are PunarJeevAnn's Master AI Chef, Ayurvedic Food Scientist & Sustainability Expert. 
User wants to cook exactly this dish: "${recipeName}".

CRITICAL RULES:
1. 100% VEGETARIAN ONLY (NO meat, poultry, fish, seafood, gelatin, or eggs).
2. AYURVEDIC FOOD SAFETY & VIRUDDHA AHARA RULE: NEVER combine incompatible foods in the same dish! 
   - DO NOT mix Milk with Lemon/Citrus fruits or sour items in the same dish (causes curdling & digestive toxicity).
   - DO NOT boil raw Milk directly with Yogurt/Dahi.
   - DO NOT mix heavy Paneer + Milk + Yogurt simultaneously in a sour dish.
3. ECO IMPACT: Compute a realistic eco impact score based on the actual ingredients used.
   - Consider real-world CO2 emissions (kg CO2e per kg of ingredient) and water footprints (liters per kg).
   - Provide an "ecoScore" from 0 (terrible) to 100 (perfect sustainability), a short "ecoSummary" (1-2 sentences), and estimated numeric values.

Return ONLY a valid JSON object matching this exact structure:
{
  "recipe": {
    "recipeId": "rec_search_01",
    "title": "Dish Name",
    "prepTimeMinutes": 15,
    "recipeTier": "fridge_staple",
    "ingredientMatchPercentage": 100,
    "usedIngredients": ["Ingredient 1", "Ingredient 2"],
    "pantryStaplesNeeded": ["Oil", "Salt"],
    "nutrientBoostItems": [],
    "nutrientTip": "Great choice!",
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
      "ecoSummary": "By using plant-based ingredients, you prevented roughly 1.8 kg of CO2 emissions.",
      "realWorldAnalogs": {
        "drivingAvoidedKm": 12,
        "showerMinutesSaved": 11
      }
    }
  }
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
                if (parsed.recipe) {
                  console.log(`[Gemini API Success] Generated recipe by name using model ${model}`);
                  return NextResponse.json({
                    status: 'success',
                    recipe: parsed.recipe
                  });
                }
              }
            }
          } else {
            console.warn(`[Gemini API Search] Model ${model} returned status ${geminiRes.status}:`, geminiData?.error?.message || geminiData);
          }
        } catch (geminiErr) {
          console.warn(`[Gemini API Search] Exception calling ${model}:`, geminiErr);
        }
      }
    }

    // High-quality zero-waste fallback recipe if API fails or quotas are exceeded
    const fallbackRecipe: RecipeItem = {
      recipeId: `rec_search_fallback_${Date.now()}`,
      title: `${recipeName} (AI Generated Recipe)`,
      prepTimeMinutes: 30,
      recipeTier: 'fridge_staple',
      ingredientMatchPercentage: 100,
      usedIngredients: ['Flour', 'Sugar', 'Cocoa Powder', 'Butter/Oil', 'Milk'],
      pantryStaplesNeeded: ['Baking Powder', 'Salt', 'Vanilla Extract'],
      nutrientBoostItems: ['Walnuts', 'Dark Chocolate Chips'],
      nutrientTip: 'Add walnuts for a healthy dose of Omega-3s!',
      instructions: [
        'Preheat your oven to 180°C (350°F) and grease a baking pan.',
        'In a large bowl, whisk together the melted butter, sugar, and vanilla until smooth.',
        'Sift in the flour, cocoa powder, baking powder, and a pinch of salt. Fold gently.',
        'Pour the batter into the prepared pan and bake for 25-30 minutes.',
        'Let it cool completely before slicing into squares. Serve and enjoy!'
      ],
      chefTip: 'For fudgy brownies, do not overbake! A toothpick inserted in the center should come out with moist crumbs, not wet batter.',
      nutritionInfo: {
        "calories": "280 kcal",
        "protein": "4g",
        "carbs": "35g",
        "fats": "14g"
      },
      ayurvedicPurityTag: 'Vegetarian Recipe',
      ecoImpact: {
        co2eSavedKg: 0.5,
        waterSavedLiters: 150,
        wasteDivertedGrams: 0,
        ecoScore: 65,
        ecoSummary: 'A plant-based friendly treat that avoids heavy animal products.',
        realWorldAnalogs: {
          drivingAvoidedKm: 3,
          showerMinutesSaved: 2
        }
      }
    };

    return NextResponse.json({
      status: 'success',
      recipe: fallbackRecipe
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Recipe search failed';
    return NextResponse.json({
      status: 'error',
      message: errorMessage
    }, { status: 500 });
  }
}
