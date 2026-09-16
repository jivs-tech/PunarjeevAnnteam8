//the og blueprint of the app , everytime a diff 
//what is index.ts ->> it exports all the types and interfaces that are used in the app 
//in simple words ->> the rulebook of the app 
//in simple code words ->> the blueprint of the app //the backbone of the app 
//think of it like a cookie cutter ->> it defines the shape of the cookie (the type of data that will be stored in the app)
//in typescript , an interface is like a contract that defines the structure of an object ->> 
//if a function is expecting an object of a certain type , it will only accept objects that match the interface ->> 
//if the object doesnt match the interface , the function will throw an error //its like if u try to pass a number to a function that expects a string , it will throw an error
export type MetricUnit =
  | 'pcs' | 'g' | 'kg' | 'ml' | 'l'
  | 'cup' | 'tbsp' | 'tsp' | 'bunch' | 'slice' | 'block';

export type IngredientCategory =
  | 'Vegetables & Greens'
  | 'Fruits'
  | 'Dairy & Plant-Milk'
  | 'Grains & Rice'
  | 'Legumes & Pulses'
  | 'Spices & Seasonings'
  | 'Condiments & Sauces'
  | 'Nuts & Seeds'
  | 'Other Staples';

export type AppStep =
  | 'landing'
  | 'manual_input'
  | 'camera_scan'
  | 'photo_review'
  | 'editable_list'
  | 'cooking_loading'
  | 'recipe_output'
  | 'recipe_detail'
  | 'saved_recipes'
  | 'pantry'
  | 'statistics'
  | 'how_to_cook'
  | 'settings';

export interface IngredientItem {
  id: string;                  // Unique UUID v4 string
  name: string;                // Normalized item name (e.g. "Tomato")
  rawInputText?: string;       // Original unparsed text (e.g. "tomat")
  quantity: number;            // Numeric value (e.g. 2)
  unit: MetricUnit;            // Unit enum (e.g. "pcs")
  category: IngredientCategory;// Categorization tag
  isAutoCorrected: boolean;    // True if Fuse.js corrected spelling
  confidenceScore?: number;    // Vision AI confidence (0.0 to 1.0)
  source: 'manual' | 'camera_vision';
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: MetricUnit;
  category: IngredientCategory;
  manufacturedDate?: string;   // YYYY-MM-DD
  expiryDate: string;          // YYYY-MM-DD
  addedAt: number;
  source: 'manual' | 'camera_vision';
}

export interface PhotoAsset {
  id: string;
  blobUrl: string;
  base64Data: string;
  fileName: string;
  timestamp: number;
}

export type NutritionalGoal =
  | 'Balanced'
  | 'High Protein'
  | 'Weight Loss'
  | 'Weight Gain'
  | 'Jain (No Onion & Garlic)'
  | 'Diabetes Friendly (Low GI)';

export interface UserPreferences {
  nutritionalGoal?: NutritionalGoal; // Kept for backwards compatibility if needed, but going forward we use selectedPreferences
  customDietaryNote?: string; // Legacy, transitioning to customPreferences
  selectedPreferences: string[];
  customPreferences: string;
}

export interface RealWorldAnalogs {
  drivingAvoidedKm: number;
  showerMinutesSaved: number;
}

export interface EcoImpact {
  co2eSavedKg: number;
  waterSavedLiters: number;
  wasteDivertedGrams: number;
  realWorldAnalogs: RealWorldAnalogs;
  ecoScore?: number;           // 0–100 score computed by AI
  ecoSummary?: string;         // Short AI-generated summary
}

export interface RecipeItem {
  recipeId: string;
  title: string;
  prepTimeMinutes: number;
  ingredientMatchPercentage: number;
  usedIngredients: string[];
  pantryStaplesNeeded: string[];
  instructions: string[];
  chefTip?: string;
  nutritionInfo?: {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
  };
  ayurvedicPurityTag?: string;
  recipeTier?: 'fridge_staple' | 'nutrient_boost';
  nutrientBoostItems?: string[];
  nutrientTip?: string;
  // Per-recipe eco impact computed dynamically by AI
  ecoImpact?: EcoImpact;
  // DB id when loaded from saved recipes
  savedRecipeDbId?: string;
}

export interface EverestQualityReport {
  overallFreshnessScore: number; // 0 to 100
  freshnessStatus: 'Optimal' | 'Use Soon' | 'Check Spoilage';
  dairyQualityAnalysis?: {
    isDairyPresent: boolean;
    dairyItemsCount: number;
    recommendedTest: string;
    shelfLifeEstimate: string;
  };
  viruddhaAharaCheck: {
    isSafe: boolean;
    safetyMessage: string;
  };
  qualityTips: string[];
}

export interface RecipeApiResponse {
  status: 'success' | 'error';
  recipes: RecipeItem[];
  everestQualityReport?: EverestQualityReport;
  message?: string;
}

export interface VisionExtractApiResponse {
  status: 'success' | 'error';
  processedImagesCount: number;
  detectedIngredients: IngredientItem[];
  message?: string;
}

export interface SavedRecipeApiResponse {
  status: 'success' | 'error';
  recipes?: RecipeItem[];
  recipe?: RecipeItem;
  message?: string;
}
