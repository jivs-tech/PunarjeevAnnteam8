'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Camera, 
  Plus, 
  Trash2, 
  Minus, 
  AlertCircle,
  ChefHat,
  ArrowLeft
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MetricUnit, IngredientCategory, NutritionalGoal } from '@/types';
import Image from 'next/image';

const METRIC_OPTIONS: MetricUnit[] = ['pcs', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'bunch', 'slice', 'block'];
const CATEGORY_OPTIONS: IngredientCategory[] = [
  'Vegetables & Greens',
  'Fruits',
  'Dairy & Plant-Milk',
  'Grains & Rice',
  'Legumes & Pulses',
  'Spices & Seasonings',
  'Condiments & Sauces',
  'Nuts & Seeds',
  'Other Staples'
];
const NUTRITION_GOALS: NutritionalGoal[] = [
  'Balanced',
  'High Protein',
  'Weight Loss',
  'Weight Gain',
  'Jain (No Onion & Garlic)',
  'Diabetes Friendly (Low GI)'
];

export const EditableListView: React.FC = () => {
  const { 
    ingredients, 
    updateIngredient, 
    removeIngredient, 
    clearIngredients, 
    setStep,
    setScanContext,
    showToast,
    setRecipesAndEco,
    userPreferences,
    setUserPreferences
  } = useAppStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleQuantityChange = (id: string, delta: number) => {
    const item = ingredients.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0.5, Math.round((item.quantity + delta) * 10) / 10);
    updateIngredient(id, { quantity: newQty });
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) {
      showToast('Please add at least 1 ingredient first!');
      return;
    }

    setStep('cooking_loading');

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, userPreferences })
      });

      const data = await response.json();
      if (data.status === 'success' && data.recipes) {
        setRecipesAndEco(data.recipes, data.everestQualityReport);
      } else {
        showToast(data.message || 'Failed to generate recipes. Using fallback recipes.');
      }
    } catch {
      showToast('Network issue. Rendering default zero-waste recipes.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-32 relative z-10">
      {/* Translucent Header with Navigation & Brand Logo */}
      <div className="flex items-center justify-between py-3 border-b border-[#c8b49e]/60 mb-4 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative shrink-0">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-black text-[#2a201b] leading-tight flex items-center gap-1.5">
                PunarJeevAnn
              </h1>
              <p className="text-[10px] text-[#6b5b50]">
                {ingredients.length} item{ingredients.length !== 1 ? 's' : ''} ready
              </p>
            </div>
          </div>
        </div>

        {ingredients.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-xl transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => {
            setScanContext('recipe');
            setStep('camera_scan');
          }}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-2xl text-xs font-bold text-[#3a2a1d] hover:bg-[#fffdf7]/50 transition shadow-sm"
        >
          <Camera className="w-4 h-4 text-[#3a2a1d]" />
          Take Photos
        </button>

        <button
          onClick={() => setStep('manual_input')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-2xl text-xs font-bold text-[#3a2a1d] hover:bg-[#fffdf7]/50 transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#3a2a1d]" />
          Add Item
        </button>
      </div>

      {/* Nutritional Goal & Dietary Profile Selector */}
      <div className="p-3.5 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-2xl mb-6 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase text-[#3a2a1d] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c88d3e]" />
            Nutritional Goal & Diet Preference:
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {NUTRITION_GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => setUserPreferences({ nutritionalGoal: goal })}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                userPreferences.nutritionalGoal === goal
                  ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#5a4636] shadow-md'
                  : 'bg-[#fffdf7]/40 text-[#3a2a1d] border-[#b8a48e] hover:bg-[#fffdf7]/60'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient Cards List */}
      {ingredients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-[#b8a48e] rounded-3xl bg-[#fffdf7]/30 backdrop-blur-md space-y-4 my-8">
          <div className="w-16 h-16 rounded-full bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 flex items-center justify-center text-[#3a2a1d]">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2a201b]">Your Ingredient List is Empty</h2>
            <p className="text-xs text-[#6b5b50] mt-1 max-w-xs">
              Add your leftover fridge items by typing them manually or scanning photos of your fridge shelves.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep('manual_input')}
              className="px-4 py-2 bg-[#3a2a1d] text-[#fcfaf5] rounded-xl text-xs font-bold shadow-lg"
            >
              Type Ingredients
            </button>
            <button
              onClick={() => {
                setScanContext('recipe');
                setStep('camera_scan');
              }}
              className="px-4 py-2 bg-[#fffdf7]/40 text-[#3a2a1d] border border-[#b8a48e] rounded-xl text-xs font-bold"
            >
              Scan Photos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3.5 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-2xl shadow-sm space-y-2.5"
            >
              {/* Top Row: Name + Delete */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateIngredient(item.id, { name: e.target.value })}
                  className="bg-transparent font-bold text-sm text-[#2a201b] outline-none border-b border-transparent focus:border-[#3a2a1d] transition w-full"
                />

                <button
                  onClick={() => removeIngredient(item.id)}
                  className="p-1.5 text-[#6b5b50] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Row: Quantity Stepper, Metric Dropdown, Category Badge */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#dcd4c3]">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#b8a48e] rounded-xl bg-[#fffdf7]/40 overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="px-2.5 py-1 text-[#3a2a1d] hover:bg-[#faf5ea] transition font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-xs font-bold text-[#3a2a1d] min-w-[28px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="px-2.5 py-1 text-[#3a2a1d] hover:bg-[#faf5ea] transition font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Metric Unit Selector */}
                <select
                  value={item.unit}
                  onChange={(e) => updateIngredient(item.id, { unit: e.target.value as MetricUnit })}
                  className="bg-[#fffdf7]/40 border border-[#b8a48e] text-xs font-bold text-[#2a201b] rounded-xl px-2 py-1 outline-none"
                >
                  {METRIC_OPTIONS.map((u) => (
                    <option key={u} value={u} className="bg-[#fffdf7]">{u}</option>
                  ))}
                </select>

                {/* Category Selector Pill */}
                <select
                  value={item.category}
                  onChange={(e) => updateIngredient(item.id, { category: e.target.value as IngredientCategory })}
                  className="bg-[#faf6ed]/40 border border-[#b8a48e] text-[11px] font-bold text-[#3a2a1d] rounded-xl px-2 py-1 outline-none max-w-[130px] truncate"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-[#fffdf7]">{c}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#2a201b]/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#fffdf7] border border-[#b8a48e] rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-[#2a201b]">Clear All Ingredients?</h3>
                <p className="text-xs text-[#6b5b50] mt-1">This will remove all items currently in your list.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 bg-[#faf6ed] text-[#3a2a1d] rounded-xl text-xs font-bold border border-[#b8a48e]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { clearIngredients(); setShowClearConfirm(false); }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom CTA — Generate Recipes */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-[#f7f3eb]/30 backdrop-blur-md border-t border-[#c8b49e] z-30">
          <button
            onClick={handleGenerateRecipes}
            className="w-full py-4 px-4 bg-[#3a2a1d]/90 backdrop-blur-md hover:bg-[#3a2a1d] active:scale-[0.99] text-[#fcfaf5] font-black text-xs tracking-wide rounded-2xl shadow-xl border border-[#5a4636] flex items-center justify-center gap-2.5 transition"
          >
            <Sparkles className="w-4 h-4 text-[#c88d3e] animate-spin" />
            GENERATE VEGETARIAN RECIPES ({ingredients.length} ITEMS)
          </button>
        </div>
      )}
    </div>
  );
};
