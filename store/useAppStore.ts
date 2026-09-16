import { create } from 'zustand';
import { 
  AppStep, 
  IngredientItem, 
  PantryItem,
  PhotoAsset, 
  RecipeItem, 
  EverestQualityReport,
  UserPreferences
} from '@/types';


const getInitialPantryItems = (): PantryItem[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('punarjeevann_pantry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved pantry items:', e);
      }
    }
  }
  return [];
};

const savePantryItems = (items: PantryItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('punarjeevann_pantry', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save pantry items to localStorage:', e);
    }
  }
};

const getInitialSavedRecipes = (): RecipeItem[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('punarjeevann_saved_recipes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved recipes:', e);
      }
    }
  }
  return [];
};

const saveSavedRecipes = (recipes: RecipeItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('punarjeevann_saved_recipes', JSON.stringify(recipes));
    } catch (e) {
      console.error('Failed to save recipes to localStorage:', e);
    }
  }
};

export interface SaveRecipeResult {
  success: boolean;
  isAuthError?: boolean;
  message?: string;
}

interface AppState {
  currentStep: AppStep;
  ingredients: IngredientItem[];
  photos: PhotoAsset[];
  recipes: RecipeItem[];
  everestQualityReport: EverestQualityReport | null;
  userPreferences: UserPreferences;
  toastMessage: string | null;
  scanContext: 'pantry' | 'recipe';

  // Selected recipe for detail view
  selectedRecipe: RecipeItem | null;
  recipeDetailSource: 'generated' | 'saved';

  // Saved recipes fetched from DB
  savedRecipes: RecipeItem[];
  savedRecipesLoading: boolean;

  // Pantry State & Actions
  pantryItems: PantryItem[];
  syncPantryFromDb: () => Promise<void>;
  addPantryItem: (item: PantryItem) => void;
  addPantryItems: (items: PantryItem[]) => void;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => void;
  removePantryItem: (id: string) => void;
  clearPantryItems: () => void;

  // Recipe Flow Actions
  setStep: (step: AppStep) => void;
  setScanContext: (ctx: 'pantry' | 'recipe') => void;
  syncPreferencesFromDb: () => Promise<void>;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  addIngredient: (item: IngredientItem) => void;
  addIngredients: (items: IngredientItem[]) => void;
  updateIngredient: (id: string, updates: Partial<IngredientItem>) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
  
  addPhoto: (photo: PhotoAsset) => boolean; // returns false if max cap (5) reached
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  setRecipesAndEco: (recipes: RecipeItem[], everestQualityReport?: EverestQualityReport) => void;

  // Recipe detail navigation
  openRecipeDetail: (recipe: RecipeItem, source: 'generated' | 'saved') => void;

  // Saved Recipes Actions
  fetchSavedRecipes: () => Promise<void>;
  saveRecipeToDb: (recipe: RecipeItem) => Promise<SaveRecipeResult>;
  unsaveRecipeFromDb: (recipeId: string, dbId?: string) => Promise<boolean>;
  isRecipeSaved: (recipeId: string) => boolean;

  showToast: (msg: string) => void;
  clearToast: () => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentStep: 'landing',
  ingredients: [],
  photos: [],
  recipes: [],
  everestQualityReport: null,
  userPreferences: {
    nutritionalGoal: 'Balanced',
    customDietaryNote: '',
    selectedPreferences: [],
    customPreferences: ''
  },
  toastMessage: null,
  scanContext: 'recipe',

  selectedRecipe: null,
  recipeDetailSource: 'generated',

  savedRecipes: getInitialSavedRecipes(),
  savedRecipesLoading: false,

  // Pantry Initial State (Loaded from fail-safe local cache, updated by Neon DB)
  pantryItems: getInitialPantryItems(),

  syncPantryFromDb: async () => {
    try {
      const res = await fetch('/api/pantry');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.items)) {
        set({ pantryItems: data.items });
        savePantryItems(data.items);
      }
    } catch (e) {
      console.warn('Neon DB pantry sync skipped or offline:', e);
    }
  },

  addPantryItem: (item: PantryItem) => {
    const updated = [item, ...get().pantryItems];
    set({ pantryItems: updated });
    savePantryItems(updated);

    fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.item) {
          const synced = get().pantryItems.map((i) => (i.id === item.id ? data.item : i));
          set({ pantryItems: synced });
          savePantryItems(synced);
        }
      })
      .catch((err) => {
        console.error('Error posting pantry item to Neon:', err);
      });
  },

  addPantryItems: (newItems: PantryItem[]) => {
    const updated = [...newItems, ...get().pantryItems];
    set({ pantryItems: updated });
    savePantryItems(updated);

    newItems.forEach((item) => {
      fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      }).catch(() => {});
    });
  },

  updatePantryItem: (id: string, updates: Partial<PantryItem>) => {
    const updated = get().pantryItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ pantryItems: updated });
    savePantryItems(updated);

    fetch('/api/pantry', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    }).catch(() => {});
  },

  removePantryItem: (id: string) => {
    const updated = get().pantryItems.filter((item) => item.id !== id);
    set({ pantryItems: updated });
    savePantryItems(updated);

    fetch(`/api/pantry?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  },

  clearPantryItems: () => {
    set({ pantryItems: [] });
    savePantryItems([]);
    fetch('/api/pantry', { method: 'DELETE' }).catch(() => {});
  },

  setStep: (step: AppStep) => set({ currentStep: step }),

  setScanContext: (ctx: 'pantry' | 'recipe') => set({ scanContext: ctx }),

  setUserPreferences: (prefs: Partial<UserPreferences>) => {
    set((state) => ({
      userPreferences: { ...state.userPreferences, ...prefs }
    }));
    
    // Background sync to DB
    fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(get().userPreferences)
    }).catch((e) => console.warn('Failed to sync preferences to DB:', e));
  },

  syncPreferencesFromDb: async () => {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      if (data.status === 'success' && data.preferences) {
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...data.preferences }
        }));
      }
    } catch (e) {
      console.warn('Failed to sync preferences from DB:', e);
    }
  },

  addIngredient: (item: IngredientItem) => set((state) => {
    const uniqueId = item.id && !state.ingredients.some((i) => i.id === item.id)
      ? item.id
      : 'ing_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    return { ingredients: [...state.ingredients, { ...item, id: uniqueId }] };
  }),

  addIngredients: (newItems: IngredientItem[]) => set((state) => {
    const existingIds = new Set(state.ingredients.map((i) => i.id));
    const processed = newItems.map((item, idx) => {
      let id = item.id;
      if (!id || existingIds.has(id)) {
        id = 'ing_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now() + '_' + idx;
      }
      existingIds.add(id);
      return { ...item, id };
    });
    return { ingredients: [...state.ingredients, ...processed] };
  }),

  updateIngredient: (id: string, updates: Partial<IngredientItem>) => set((state) => ({
    ingredients: state.ingredients.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  removeIngredient: (id: string) => set((state) => ({
    ingredients: state.ingredients.filter((item) => item.id !== id)
  })),

  clearIngredients: () => set({ ingredients: [] }),

  addPhoto: (photo: PhotoAsset) => {
    const { photos, showToast } = get();
    if (photos.length >= 5) {
      showToast('Maximum limit of 5 photos reached per session.');
      return false;
    }
    set({ photos: [...photos, photo] });
    return true;
  },

  removePhoto: (id: string) => set((state) => ({
    photos: state.photos.filter((p) => p.id !== id)
  })),

  clearPhotos: () => set({ photos: [] }),

  setRecipesAndEco: (recipes: RecipeItem[], everestQualityReport?: EverestQualityReport) => set({
    recipes,
    everestQualityReport: everestQualityReport || null,
    photos: [],
    currentStep: 'recipe_output'
  }),

  openRecipeDetail: (recipe: RecipeItem, source: 'generated' | 'saved') => set({
    selectedRecipe: recipe,
    recipeDetailSource: source,
    currentStep: 'recipe_detail'
  }),

  fetchSavedRecipes: async () => {
    set({ savedRecipesLoading: true });
    try {
      const res = await fetch('/api/saved-recipes');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.recipes)) {
        // Merge with existing local items so nothing is lost
        const remoteIds = new Set(data.recipes.map((r: RecipeItem) => r.recipeId));
        const localOnly = get().savedRecipes.filter((r) => !remoteIds.has(r.recipeId));
        const merged = [...data.recipes, ...localOnly];
        set({ savedRecipes: merged });
        saveSavedRecipes(merged);
      }
    } catch (e) {
      console.warn('Failed to fetch saved recipes from API:', e);
    } finally {
      set({ savedRecipesLoading: false });
    }
  },

  saveRecipeToDb: async (recipe: RecipeItem): Promise<SaveRecipeResult> => {
    try {
      const res = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe)
      });

      if (res.status === 401) {
        return { success: false, isAuthError: true, message: 'Please sign in to save recipes to your account.' };
      }

      const data = await res.json();
      if (data.status === 'unauthenticated') {
        return { success: false, isAuthError: true, message: data.message || 'Please sign in to save recipes.' };
      }

      if (data.status === 'success' && data.recipe) {
        const updated = [data.recipe, ...get().savedRecipes.filter((r) => r.recipeId !== recipe.recipeId)];
        set({ savedRecipes: updated });
        saveSavedRecipes(updated);
        return { success: true };
      }

      // Even if server reported an internal DB error, save locally so the user experience is preserved
      const localRecipe = { ...recipe, savedRecipeDbId: 'local_' + Date.now() };
      const fallback = [localRecipe, ...get().savedRecipes.filter((r) => r.recipeId !== recipe.recipeId)];
      set({ savedRecipes: fallback });
      saveSavedRecipes(fallback);
      return { success: true };
    } catch (err: any) {
      // Offline / network failure fallback
      const localRecipe = { ...recipe, savedRecipeDbId: 'local_' + Date.now() };
      const fallback = [localRecipe, ...get().savedRecipes.filter((r) => r.recipeId !== recipe.recipeId)];
      set({ savedRecipes: fallback });
      saveSavedRecipes(fallback);
      return { success: true };
    }
  },

  unsaveRecipeFromDb: async (recipeId: string, dbId?: string): Promise<boolean> => {
    const idToDelete = dbId || recipeId;
    const filtered = get().savedRecipes.filter(
      (r) => r.savedRecipeDbId !== idToDelete && r.recipeId !== recipeId
    );
    set({ savedRecipes: filtered });
    saveSavedRecipes(filtered);

    try {
      await fetch(`/api/saved-recipes?id=${encodeURIComponent(idToDelete)}`, {
        method: 'DELETE'
      });
      return true;
    } catch {
      return true;
    }
  },

  isRecipeSaved: (recipeId: string): boolean => {
    return get().savedRecipes.some((r) => r.recipeId === recipeId);
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3000);
  },

  clearToast: () => set({ toastMessage: null }),

  resetAll: () => set({
    currentStep: 'landing',
    ingredients: [],
    photos: [],
    recipes: [],
    everestQualityReport: null,
    toastMessage: null,
    selectedRecipe: null,
    recipeDetailSource: 'generated'
  })
}));
