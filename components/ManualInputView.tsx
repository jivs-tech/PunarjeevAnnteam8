'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Camera,
  ArrowRight,
  ArrowLeft,
  Tag,
  Scale,
  Trash2,
  ChevronRight,
  Package,
  CheckSquare,
  X,
  Lock
} from 'lucide-react';
import { useAuth, SignInButton, Show, UserButton } from '@clerk/nextjs';
import { useAppStore } from '@/store/useAppStore';
import { processRawInput, getSuggestions } from '@/lib/fuseEngine';
import { MetricUnit, IngredientCategory, IngredientItem } from '@/types';
import { VegetarianIngredientEntry } from '@/data/vegetarianIngredients';
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

const emptySubscribe = () => () => {};
const useHasMounted = () =>
  React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

export const ManualInputView: React.FC = () => {
  const { isSignedIn } = useAuth();
  const {
    setStep,
    setScanContext,
    addIngredient,
    addIngredients,
    ingredients,
    removeIngredient,
    pantryItems,
    showToast
  } = useAppStore();

  const hasMounted = useHasMounted();
  const [inputName, setInputName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<MetricUnit | ''>('');
  const [category, setCategory] = useState<IngredientCategory | ''>('');
  const [suggestions, setSuggestions] = useState<VegetarianIngredientEntry[]>([]);
  const [correctionBadge, setCorrectionBadge] = useState<string | null>(null);

  // Pantry Modal Selection State
  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);
  const [selectedPantryIds, setSelectedPantryIds] = useState<Set<string>>(new Set());

  const togglePantryItemSelection = (id: string) => {
    const next = new Set(selectedPantryIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPantryIds(next);
  };

  const unexpiredPantryItems = pantryItems.filter(p => {
    if (!p.expiryDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(p.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 0;
  });

  const toggleSelectAllPantry = () => {
    if (selectedPantryIds.size === unexpiredPantryItems.length) {
      setSelectedPantryIds(new Set());
    } else {
      setSelectedPantryIds(new Set(unexpiredPantryItems.map((p) => p.id)));
    }
  };

  const handleImportSelectedPantry = () => {
    const selectedItems = pantryItems.filter((p) => selectedPantryIds.has(p.id));
    if (selectedItems.length === 0) return;

    const converted: IngredientItem[] = selectedItems.map((p) => ({
      id: 'pantry_ing_' + Math.random().toString(36).substring(2, 9),
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      category: p.category,
      isAutoCorrected: false,
      source: p.source || 'manual'
    }));

    addIngredients(converted);
    showToast(`Added ${converted.length} ingredient(s) from Pantry!`);
    setSelectedPantryIds(new Set());
    setIsPantryModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputName(val);
    if (val.trim().length >= 2) {
      setSuggestions(getSuggestions(val));
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (entry: VegetarianIngredientEntry) => {
    setInputName(entry.name);
    setUnit(entry.defaultUnit);
    setCategory(entry.category);
    setSuggestions([]);
  };

  const handleBlur = () => {
    if (!inputName.trim()) return;
    const result = processRawInput(
      inputName,
      typeof quantity === 'number' ? quantity : undefined,
      unit || undefined,
      category || undefined
    );
    if (result.wasCorrected) {
      setInputName(result.ingredient.name);
      setCorrectionBadge(`Corrected to "${result.ingredient.name}"`);
      setTimeout(() => setCorrectionBadge(null), 2500);
    }
    if (!unit && result.ingredient.unit) {
      setUnit(result.ingredient.unit);
    }
    if (!category && result.ingredient.category) {
      setCategory(result.ingredient.category);
    }
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputName.trim()) {
      showToast('Please enter an ingredient name.');
      return;
    }

    const result = processRawInput(
      inputName,
      typeof quantity === 'number' ? quantity : undefined,
      unit || undefined,
      category || undefined
    );

    addIngredient(result.ingredient);

    if (result.wasCorrected) {
      showToast(`Spell corrected: "${inputName}" → "${result.ingredient.name}"`);
    } else {
      showToast(`Added ${result.ingredient.name}`);
    }

    // Reset input form
    setInputName('');
    setQuantity('');
    setUnit('');
    setCategory('');
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 text-[#2a201b] relative z-10">
      {/* Header with Navigation, Brand Logo & Clerk User Profile */}
      <div className="flex items-center justify-between py-2 border-b border-[#c8b49e]/60 mb-4 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 relative shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-xs font-black text-[#2a201b] tracking-wide">
              PunarJeevAnn
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMounted && (
            <>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-2.5 py-1 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] rounded-xl text-[11px] font-bold transition shadow-sm">
                    Sign In
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation Switcher: Add Manually | Scan Items (Camera) */}
      <div className="grid grid-cols-2 p-1 bg-[#efe8da]/30 border border-[#b8a48e]/70 rounded-2xl mb-5 backdrop-blur-md">
        <button
          type="button"
          className="py-2 text-xs font-bold text-[#fcfaf5] bg-[#3a2a1d] rounded-xl shadow-sm transition text-center"
        >
          Add Manually
        </button>
        <button
          type="button"
          onClick={() => {
            setScanContext('recipe');
            setStep('camera_scan');
          }}
          className="py-2 text-xs font-semibold text-[#6b5b50] hover:text-[#2a201b] rounded-xl transition text-center flex items-center justify-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          Scan Items (Camera)
        </button>
      </div>

      {/* Main Form: Translucent Cards & Prominent Borders */}
      <form onSubmit={handleAdd} className="space-y-4">
        {/* Ingredient Name Input with Auto-Complete */}
        <div className="relative">
          <label className="block text-xs font-bold text-[#3a2a1d] mb-1">
            Ingredient Name <span className="text-[#c88d3e]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g. tomato, paneer, leftover rice..."
              className="w-full bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] focus:border-[#3a2a1d] focus:bg-[#fffdf7]/50 rounded-2xl px-4 py-3 text-sm font-semibold text-[#2a201b] placeholder-[#9c8b7f] outline-none transition shadow-sm"
              autoFocus
            />
            {inputName && (
              <button
                type="button"
                onClick={() => { setInputName(''); setSuggestions([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5b50] hover:text-[#2a201b] text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Spell Correction Toast Badge */}
          <AnimatePresence>
            {correctionBadge && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 px-3 py-1 bg-[#c88d3e]/15 border border-[#c88d3e]/40 rounded-lg text-[#9a6520] text-xs font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c88d3e]" />
                {correctionBadge}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Autocomplete Suggestions Popup */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#fffdf7]/35 backdrop-blur-xl border-[1.5px] border-[#b8a48e] rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
            >
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-2.5 text-xs text-[#2a201b] hover:bg-[#3a2a1d]/10 flex items-center justify-between border-b border-[#e8dfd0] last:border-none transition"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="text-[10px] text-[#6b5b50] px-2 py-0.5 rounded bg-[#f4f0e6]">{item.category}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Quantity & Unit Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#6b5b50]" />
              Quantity (Optional)
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="Default: 1"
              className="w-full bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] focus:border-[#3a2a1d] focus:bg-[#fffdf7]/50 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#2a201b] placeholder-[#9c8b7f] outline-none transition shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3a2a1d] mb-1">
              Metric Unit (Optional)
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as MetricUnit)}
              className="w-full bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] focus:border-[#3a2a1d] focus:bg-[#fffdf7]/50 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#2a201b] outline-none transition shadow-sm"
            >
              <option value="" className="bg-[#fffdf7]">Auto Detect</option>
              {METRIC_OPTIONS.map((u) => (
                <option key={u} value={u} className="bg-[#fffdf7]">{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Selector Row */}
        <div>
          <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#6b5b50]" />
            Category (Optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
            className="w-full bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] focus:border-[#3a2a1d] focus:bg-[#fffdf7]/50 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#2a201b] outline-none transition shadow-sm"
          >
            <option value="" className="bg-[#fffdf7]">Auto Match Category</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} className="bg-[#fffdf7]">{c}</option>
            ))}
          </select>
        </div>

        {/* Add Ingredient CTA Button: Translucent */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-[#3a2a1d]/90 backdrop-blur-md hover:bg-[#3a2a1d] active:scale-[0.99] text-[#fcfaf5] font-bold rounded-2xl shadow-lg border border-[#5a4636] flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient to List
        </button>

        {/* Add from Pantry Button (Visible to all users, smaller half-size button) */}
        {hasMounted && (
          <button
            type="button"
            onClick={() => setIsPantryModalOpen(true)}
            className="w-full py-2 px-3 bg-[#efe8da]/60 backdrop-blur-md hover:bg-[#efe8da] active:scale-[0.98] text-[#3a2a1d] font-bold text-xs rounded-xl border border-[#b8a48e] flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Package className="w-3.5 h-3.5 text-[#3a2a1d]" />
            {isSignedIn
              ? `Add from Pantry (${unexpiredPantryItems.length} items available)`
              : 'Add from Pantry (Sign in required)'}
            {!isSignedIn && <Lock className="w-3 h-3 text-[#c88d3e] ml-0.5" />}
          </button>
        )}
      </form>

      {/* Active Added Items Preview */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#2a201b] flex items-center gap-2">
            Active Ingredients List
            <span className="px-2 py-0.5 bg-[#efe8da]/40 text-[#3a2a1d] border border-[#d8cca8] rounded-full text-xs font-bold">
              {ingredients.length}
            </span>
          </h2>
          {ingredients.length > 0 && (
            <button
              onClick={() => setStep('editable_list')}
              className="text-xs text-[#3a2a1d] hover:underline flex items-center gap-1 font-bold"
            >
              View Full List
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {ingredients.length === 0 ? (
          <div className="p-6 text-center border-[1.5px] border-dashed border-[#b8a48e] rounded-2xl bg-[#fffdf7]/30 backdrop-blur-md">
            <p className="text-xs font-bold text-[#4a3b30]">No ingredients added yet.</p>
            <p className="text-[11px] text-[#7a6b5f] mt-1">Type items above or click &quot;Camera Scan&quot; to take photos.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {ingredients.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-2xl shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-[#2a201b] flex items-center gap-1.5">
                    {item.name}
                    {item.isAutoCorrected && (
                      <span className="px-1.5 py-0.5 bg-[#c88d3e]/15 text-[#9a6520] text-[10px] rounded border border-[#c88d3e]/30">
                        Auto-corrected
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#6b5b50]">
                    {item.quantity} {item.unit} • <span className="text-[#3a2a1d] font-bold">{item.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeIngredient(item.id)}
                  className="p-1.5 text-[#6b5b50] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      {ingredients.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-[#f7f3eb]/30 backdrop-blur-md border-t border-[#c8b49e] z-30">
          <button
            onClick={() => setStep('editable_list')}
            className="w-full py-3.5 px-4 bg-[#3a2a1d]/90 backdrop-blur-md hover:bg-[#3a2a1d] active:scale-[0.99] text-[#fcfaf5] font-bold rounded-2xl shadow-lg border border-[#5a4636] flex items-center justify-center gap-2 transition"
          >
            Review & Edit Ingredient List ({ingredients.length})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PANTRY SELECTION MODAL */}
      <AnimatePresence>
        {isPantryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#fffdf7] border border-[#b8a48e] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#e8dfd0] pb-2.5">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#3a2a1d]" />
                  <h3 className="text-sm font-bold text-[#2a201b]">Select Pantry Ingredients</h3>
                </div>
                <button
                  onClick={() => setIsPantryModalOpen(false)}
                  className="p-1 text-[#6b5b50] hover:text-[#2a201b]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isSignedIn ? (
                <div className="p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 rounded-2xl flex items-center justify-center mx-auto text-[#c88d3e]">
                    <Lock className="w-6 h-6 text-[#3a2a1d]" />
                  </div>
                  <h3 className="text-base font-black text-[#2a201b]">Sign In to Import Pantry Items</h3>
                  <p className="text-xs text-[#6b5b50] leading-relaxed">
                    Sign in or register to import ingredients directly from your cloud pantry into the recipe generator.
                  </p>
                  <SignInButton mode="modal">
                    <button className="w-full py-3 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] font-bold text-xs rounded-2xl transition shadow-md border border-[#5a4636] flex items-center justify-center gap-2 mt-2">
                      <Sparkles className="w-4 h-4 text-[#f5d7a6]" />
                      Sign In / Register
                    </button>
                  </SignInButton>
                </div>
              ) : unexpiredPantryItems.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs font-bold text-[#4a3b30]">Your Pantry is currently empty or only has expired items.</p>
                  <p className="text-[11px] text-[#7a6b5f]">Add fresh items in your Pantry first to import them here.</p>
                  <button
                    onClick={() => {
                      setIsPantryModalOpen(false);
                      setStep('pantry');
                    }}
                    className="mt-2 px-4 py-2 bg-[#3a2a1d] text-[#fcfaf5] text-xs font-bold rounded-xl shadow-sm"
                  >
                    Go to Pantry
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-[#6b5b50] px-1">
                    <span>{unexpiredPantryItems.length} Fresh Pantry Items</span>
                    <button
                      type="button"
                      onClick={toggleSelectAllPantry}
                      className="text-[#3a2a1d] underline hover:text-[#5a4636]"
                    >
                      {selectedPantryIds.size === unexpiredPantryItems.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {unexpiredPantryItems.map((item) => {
                      const isSelected = selectedPantryIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => togglePantryItemSelection(item.id)}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-[#efe8da] border-[#3a2a1d] shadow-sm'
                              : 'bg-[#fffdf7]/60 border-[#b8a48e]/60 hover:bg-[#fffdf7]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              isSelected ? 'bg-[#3a2a1d] border-[#3a2a1d] text-white' : 'border-[#b8a48e] bg-white'
                            }`}>
                              {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#2a201b]">{item.name}</div>
                              <div className="text-[10px] text-[#6b5b50]">
                                {item.quantity} {item.unit} • {item.category}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#6b5b50] bg-[#f4f0e6] px-2 py-0.5 rounded-md">
                            {item.expiryDate ? `Exp: ${item.expiryDate}` : 'Fresh'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8dfd0]">
                    <button
                      type="button"
                      onClick={() => setIsPantryModalOpen(false)}
                      className="px-3.5 py-2 text-xs font-bold text-[#6b5b50] hover:text-[#2a201b]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedPantryIds.size === 0}
                      onClick={handleImportSelectedPantry}
                      className="px-4 py-2 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] text-xs font-bold rounded-xl shadow-md transition disabled:opacity-40"
                    >
                      Import Selected ({selectedPantryIds.size})
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
