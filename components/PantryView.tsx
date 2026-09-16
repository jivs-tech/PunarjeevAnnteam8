'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Camera, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Calendar, 
  Tag, 
  Scale, 
  Clock, 
  ChefHat, 
  X,
  Filter,
  PackageCheck,
  Lock,
  Loader2
} from 'lucide-react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useAppStore } from '@/store/useAppStore';
import { MetricUnit, IngredientCategory, PantryItem, IngredientItem } from '@/types';
import { processRawInput, getSuggestions } from '@/lib/fuseEngine';
import { VegetarianIngredientEntry } from '@/data/vegetarianIngredients';
import { calculateLogicalExpiryDate } from '@/lib/pantryExpiryHelper';
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

export const PantryView: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { 
    setStep, 
    setScanContext,
    pantryItems, 
    syncPantryFromDb,
    addPantryItem, 
    updatePantryItem, 
    removePantryItem, 
    addIngredients,
    setRecipesAndEco,
    showToast,
    userPreferences
  } = useAppStore();

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncPantryFromDb();
    }
  }, [isLoaded, isSignedIn, syncPantryFromDb]);

  // Top Tabs: 'add' | 'expiry' | 'recipes'
  const [activeTab, setActiveTab] = useState<'add' | 'expiry' | 'recipes'>('expiry');

  // Sub-tabs for Add Ingredients: 'manual' | 'camera'
  const [addMode, setAddMode] = useState<'manual' | 'camera'>('manual');

  // Form State for Adding Item
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<MetricUnit | ''>('');
  const [category, setCategory] = useState<IngredientCategory | ''>('');
  const [manufacturedDate, setManufacturedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [autoEstimateExpiry, setAutoEstimateExpiry] = useState(true);
  const [suggestions, setSuggestions] = useState<VegetarianIngredientEntry[]>([]);

  // Filter & Search State for Expiry Alerts Tab
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'week'>('all');

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  // Recipe Generation State
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-calculate suggested logical expiry date based on item name & category via API / local engine
  const fetchApiEstimatedExpiry = async (itemName: string, itemCat?: string) => {
    if (!itemName.trim()) return;
    try {
      const res = await fetch('/api/pantry/estimate-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemName, category: itemCat })
      });
      const data = await res.json();
      if (data.status === 'success' && data.expiryDate) {
        setExpiryDate(data.expiryDate);
        if (data.category && (!category || category === 'Other Staples')) {
          setCategory(data.category as IngredientCategory);
        }
        return;
      }
    } catch {
      // Fallback quietly to local logical expiry engine
    }
    setExpiryDate(calculateLogicalExpiryDate(itemName, itemCat));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim().length >= 1) {
      if (val.trim().length >= 2) {
        setSuggestions(getSuggestions(val));
      } else {
        setSuggestions([]);
      }
      if (autoEstimateExpiry || !expiryDate) {
        const estimated = calculateLogicalExpiryDate(val, category || undefined);
        setExpiryDate(estimated);
      }
    } else {
      setSuggestions([]);
      if (autoEstimateExpiry) {
        setExpiryDate('');
      }
    }
  };

  const handleNameBlur = () => {
    if (name.trim() && (autoEstimateExpiry || !expiryDate)) {
      fetchApiEstimatedExpiry(name, category || undefined);
    }
  };

  const handleSelectSuggestion = (entry: VegetarianIngredientEntry) => {
    setName(entry.name);
    setUnit(entry.defaultUnit);
    setCategory(entry.category);
    if (autoEstimateExpiry || !expiryDate) {
      fetchApiEstimatedExpiry(entry.name, entry.category);
    }
    setSuggestions([]);
  };

  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter an item name.');
      return;
    }

    const processed = processRawInput(
      name,
      typeof quantity === 'number' ? quantity : undefined,
      unit || undefined,
      category || undefined
    );

    const finalCat = processed.ingredient.category;
    const finalUnit = processed.ingredient.unit;
    const finalQty = processed.ingredient.quantity;

    const finalExpiry = expiryDate || calculateLogicalExpiryDate(processed.ingredient.name, finalCat);

    setIsAddingItem(true);
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: processed.ingredient.name,
          quantity: finalQty,
          unit: finalUnit,
          category: finalCat,
          expiryDate: finalExpiry
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        // Optimistically add it or sync
        await syncPantryFromDb();
        showToast(`Added ${data.item.name} to Pantry (Expires: ${data.item.expiryDate})!`);
        
        // Reset Form
        setName('');
        setQuantity('');
        setUnit('');
        setCategory('');
        setManufacturedDate('');
        setExpiryDate('');
        setAutoEstimateExpiry(true);
        setSuggestions([]);
        setActiveTab('expiry'); // Switch to view expiry alert list
      } else {
        showToast(data.message || 'Failed to add item to Pantry.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving item. Please try again.');
    } finally {
      setIsAddingItem(false);
    }
  };

  // Calculate days remaining to expiry
  const getDaysLeft = (expiryStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryStr);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to determine subtle, sober urgency color styling
  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return {
        cardStyle: 'bg-gray-100/50 border-2 border-gray-300 shadow-sm opacity-60 grayscale',
        badgeStyle: 'bg-gray-500 text-white font-black',
        text: 'Expired',
        icon: '❌'
      };
    } else if (daysLeft <= 1) {
      return {
        cardStyle: 'bg-rose-500/10 border-2 border-rose-500/80 shadow-md animate-pulse',
        badgeStyle: 'bg-rose-600 text-white font-black animate-pulse',
        text: daysLeft === 0 ? 'Expires Today!' : 'Expiring Tomorrow!',
        icon: '⚡'
      };
    } else if (daysLeft <= 5) {
      return {
        cardStyle: 'bg-red-500/10 border border-red-400/60 shadow-sm',
        badgeStyle: 'bg-red-700/85 text-white font-bold',
        text: `Expiring in ${daysLeft} days`,
        icon: '🔴'
      };
    } else if (daysLeft <= 10) {
      return {
        cardStyle: 'bg-amber-500/10 border border-amber-400/50 shadow-sm',
        badgeStyle: 'bg-amber-700/80 text-white font-bold',
        text: `Expiring in ${daysLeft} days`,
        icon: '🟠'
      };
    } else if (daysLeft <= 30) {
      return {
        cardStyle: 'bg-yellow-500/10 border border-yellow-500/40 shadow-sm',
        badgeStyle: 'bg-yellow-800/80 text-white font-semibold',
        text: `Expires in ${daysLeft} days`,
        icon: '🟡'
      };
    } else {
      return {
        cardStyle: 'bg-emerald-500/10 border border-emerald-500/35 shadow-sm',
        badgeStyle: 'bg-emerald-800/80 text-white font-medium',
        text: `Fresh (${daysLeft} days)`,
        icon: '🟢'
      };
    }
  };

  // Sort pantry items by ascending order of expiry date (soonest first)
  const sortedPantryItems = useMemo(() => {
    let items = [...pantryItems].sort((a, b) => {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    // Filter out expired items from the expiry alerts list
    items = items.filter((i) => getDaysLeft(i.expiryDate) >= 0);

    if (selectedCategory !== 'All') {
      items = items.filter((i) => i.category === selectedCategory);
    }

    if (urgencyFilter === 'urgent') {
      items = items.filter((i) => getDaysLeft(i.expiryDate) <= 5);
    } else if (urgencyFilter === 'week') {
      items = items.filter((i) => getDaysLeft(i.expiryDate) <= 7);
    }

    return items;
  }, [pantryItems, selectedCategory, urgencyFilter]);

  // "Go to Recipe" CTA for a specific pantry item
  const handleGoToRecipeForItem = (item: PantryItem) => {
    if (getDaysLeft(item.expiryDate) < 0) {
      showToast(`Cannot use ${item.name} for recipes because it has expired.`);
      return;
    }

    const convertedItem: IngredientItem = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      isAutoCorrected: false,
      source: item.source
    };

    addIngredients([convertedItem]);
    showToast(`Added ${item.name} to Recipe Generator!`);
    setStep('manual_input');
  };

  // Generate Recipe for all pantry items
  const handleGeneratePantryRecipes = async () => {
    const validPantryItems = pantryItems.filter(p => getDaysLeft(p.expiryDate) >= 0);

    if (validPantryItems.length === 0) {
      showToast(pantryItems.length > 0 ? 'All your pantry items are expired. No fresh items to generate recipes from!' : 'Your pantry is empty. Add items first!');
      return;
    }

    setIsGenerating(true);
    setStep('cooking_loading');

    const ingredientPayload: IngredientItem[] = validPantryItems.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      category: p.category,
      isAutoCorrected: false,
      source: p.source
    }));

    try {
      const res = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredientPayload,
          userPreferences: userPreferences
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setRecipesAndEco(data.recipes, data.everestQualityReport);
      } else {
        showToast(data.message || 'Recipe generation failed.');
        setStep('pantry');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to recipe generator.');
      setStep('pantry');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#2a201b]">
        <div className="w-8 h-8 border-4 border-[#3a2a1d] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#6b5b50]">Checking Authentication...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col min-h-[85vh] text-[#2a201b] relative z-10 px-3 py-4">
        <div className="flex items-center justify-between py-3 border-b border-[#c8b49e]/60 mb-6 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border shadow-sm">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-[#2a201b]">Pantry</h1>
          </div>
          <div className="w-7" />
        </div>

        <div className="my-auto max-w-sm mx-auto w-full p-6 bg-[#fffdf7]/70 backdrop-blur-md border border-[#b8a48e] rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 rounded-2xl flex items-center justify-center mx-auto text-[#c88d3e]">
            <Lock className="w-7 h-7 text-[#3a2a1d]" />
          </div>
          <h2 className="text-lg font-black text-[#2a201b]">Private Pantry Access</h2>
          <p className="text-xs text-[#6b5b50] leading-relaxed">
            Please sign in to securely track your kitchen inventory, monitor item freshness, and get automated expiry alerts synced to your cloud account.
          </p>

          <SignInButton mode="modal">
            <button className="w-full py-3 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] font-bold text-xs rounded-2xl transition shadow-md border border-[#5a4636] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f5d7a6]" />
              Sign In / Register to Access Pantry
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 text-[#2a201b] relative z-10">
      {/* Header: Title "Pantry", Back Button & Logo */}
      <div className="flex items-center justify-between py-3 border-b border-[#c8b49e]/60 mb-4 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Landing"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative shrink-0">
              <Image 
                src="/logo.png" 
                alt="PunarJeevAnn" 
                fill 
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-black text-[#2a201b] leading-tight">
                Pantry
              </h1>
              <p className="text-[10px] text-[#6b5b50]">Track inventory & expiry alerts</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 bg-[#efe8da]/40 text-[#3a2a1d] border border-[#d8cca8] rounded-full text-xs font-bold flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-[#3a2a1d]" />
            {pantryItems.length} items
          </span>
        </div>
      </div>

      {/* Main 3-Tab Navigation Bar: Add Ingredients | Expiry Alerts | Recipes */}
      <div className="grid grid-cols-3 p-1 bg-[#efe8da]/30 border border-[#b8a48e]/70 rounded-2xl mb-5 backdrop-blur-md shadow-sm">
        <button
          onClick={() => setActiveTab('add')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 ${
            activeTab === 'add'
              ? 'bg-[#3a2a1d] text-[#fcfaf5] shadow-sm'
              : 'text-[#6b5b50] hover:text-[#2a201b]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
        <button
          onClick={() => setActiveTab('expiry')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 ${
            activeTab === 'expiry'
              ? 'bg-[#3a2a1d] text-[#fcfaf5] shadow-sm'
              : 'text-[#6b5b50] hover:text-[#2a201b]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Expiry Alerts
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 ${
            activeTab === 'recipes'
              ? 'bg-[#3a2a1d] text-[#fcfaf5] shadow-sm'
              : 'text-[#6b5b50] hover:text-[#2a201b]'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Pantry Recipes
        </button>
      </div>

      {/* TAB 1: ADD INGREDIENTS */}
      {activeTab === 'add' && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Sub-tab Switcher: Add Manually | Scan Items (Camera) */}
          <div className="grid grid-cols-2 p-1 bg-[#fffdf7]/30 border border-[#b8a48e]/60 rounded-xl">
            <button
              onClick={() => setAddMode('manual')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                addMode === 'manual'
                  ? 'bg-[#3a2a1d] text-[#fcfaf5]'
                  : 'text-[#6b5b50] hover:text-[#2a201b]'
              }`}
            >
              Add Manually
            </button>
            <button
              onClick={() => {
                setScanContext('pantry');
                setStep('camera_scan');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                addMode === 'camera'
                  ? 'bg-[#3a2a1d] text-[#fcfaf5]'
                  : 'text-[#6b5b50] hover:text-[#2a201b]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Items (Camera)
            </button>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4 bg-[#fffdf7]/30 backdrop-blur-md p-4 rounded-3xl border border-[#b8a48e] shadow-sm">
            {/* Item Name Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#3a2a1d] mb-1">
                Item Name <span className="text-[#c88d3e]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="e.g. Milk, Tomato, Paneer, Apple..."
                className="w-full bg-[#fffdf7]/30 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#2a201b] placeholder-[#9c8b7f] outline-none transition"
                autoFocus
              />

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#fffdf7]/95 backdrop-blur-xl border border-[#b8a48e] rounded-2xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-2 text-xs text-[#2a201b] hover:bg-[#3a2a1d]/10 flex items-center justify-between border-b border-[#e8dfd0] last:border-none"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[10px] text-[#6b5b50] px-2 py-0.5 rounded bg-[#f4f0e6]">{item.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity & Unit Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-[#6b5b50]" />
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="Default: 1"
                  className="w-full bg-[#fffdf7]/90 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-3.5 py-2 text-sm font-semibold text-[#2a201b] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2a1d] mb-1">
                  Metric Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as MetricUnit)}
                  className="w-full bg-[#fffdf7]/90 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-3.5 py-2 text-sm font-semibold text-[#2a201b] outline-none transition"
                >
                  <option value="">Auto Detect</option>
                  {METRIC_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Row */}
            <div>
              <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#6b5b50]" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as IngredientCategory;
                  setCategory(cat);
                  if ((autoEstimateExpiry || !expiryDate) && name.trim()) {
                    fetchApiEstimatedExpiry(name, cat);
                  }
                }}
                className="w-full bg-[#fffdf7]/90 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-3.5 py-2 text-sm font-semibold text-[#2a201b] outline-none transition"
              >
                <option value="">Auto Match Category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Dates: Manufactured Date (Optional) & Expiry Date */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#e8dfd0]">
              <div>
                <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6b5b50]" />
                  Mfg Date (Optional)
                </label>
                <input
                  type="date"
                  value={manufacturedDate}
                  onChange={(e) => setManufacturedDate(e.target.value)}
                  className="w-full bg-[#fffdf7]/90 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-3 py-2 text-xs font-semibold text-[#2a201b] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2a1d] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#6b5b50]" />
                    Expiry Date
                  </span>
                  {autoEstimateExpiry && (
                    <span className="text-[10px] text-[#c88d3e] font-extrabold flex items-center gap-0.5" title="Auto-calculated logical expiry date">
                      <Sparkles className="w-3 h-3 text-[#c88d3e]" />
                      Auto Logical
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    setAutoEstimateExpiry(false);
                  }}
                  className="w-full bg-[#fffdf7]/90 border border-[#b8a48e] focus:border-[#3a2a1d] rounded-2xl px-3 py-2 text-xs font-semibold text-[#2a201b] outline-none transition"
                />
              </div>
            </div>

            {/* Submit Button: Subtle, Sober */}
            <button
              type="submit"
              disabled={isAddingItem}
              className={`w-full py-3 px-4 bg-[#3a2a1d]/90 hover:bg-[#3a2a1d] text-[#fcfaf5] font-bold rounded-2xl border border-[#5a4636] flex items-center justify-center gap-2 transition shadow-md ${isAddingItem ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAddingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isAddingItem ? 'Saving to Database...' : 'Save Item to Pantry'}
            </button>
          </form>
        </motion.div>
      )}

      {/* TAB 2: EXPIRY ALERTS */}
      {activeTab === 'expiry' && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filters Bar: Category & Urgency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#3a2a1d]">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#6b5b50]" />
                Filter Pantry Items
              </span>
              <span className="text-[11px] text-[#6b5b50] font-medium">Sorted by earliest expiry</span>
            </div>

            {/* Urgency Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setUrgencyFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition shrink-0 ${
                  urgencyFilter === 'all'
                    ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#3a2a1d]'
                    : 'bg-[#fffdf7]/70 text-[#6b5b50] border-[#b8a48e]'
                }`}
              >
                All Items ({pantryItems.length})
              </button>
              <button
                onClick={() => setUrgencyFilter('urgent')}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition shrink-0 ${
                  urgencyFilter === 'urgent'
                    ? 'bg-rose-700 text-white border-rose-800'
                    : 'bg-rose-50/70 text-rose-800 border-rose-200'
                }`}
              >
                High Risk (≤5 days)
              </button>
              <button
                onClick={() => setUrgencyFilter('week')}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition shrink-0 ${
                  urgencyFilter === 'week'
                    ? 'bg-amber-700 text-white border-amber-800'
                    : 'bg-amber-50/70 text-amber-800 border-amber-200'
                }`}
              >
                This Week (≤7 days)
              </button>
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#fffdf7]/70 border border-[#b8a48e] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3a2a1d] outline-none shadow-sm"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Pantry Expiry Alerts List */}
          {sortedPantryItems.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#b8a48e] rounded-3xl bg-[#fffdf7]/50 backdrop-blur-md">
              <PackageCheck className="w-8 h-8 text-[#9c8b7f] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#4a3b30]">No pantry items match your filter.</p>
              <p className="text-[11px] text-[#7a6b5f] mt-1">Add items to track their freshness & receive alerts.</p>
              <button
                onClick={() => setActiveTab('add')}
                className="mt-3 px-4 py-2 bg-[#3a2a1d] text-[#fcfaf5] rounded-xl text-xs font-bold shadow-sm"
              >
                + Add First Pantry Item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPantryItems.map((item) => {
                const daysLeft = getDaysLeft(item.expiryDate);
                const badgeInfo = getUrgencyBadge(daysLeft);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-3xl backdrop-blur-md transition-all relative ${badgeInfo.cardStyle}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#2a201b] leading-tight">
                            {item.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${badgeInfo.badgeStyle}`}>
                            {badgeInfo.icon} {badgeInfo.text}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#6b5b50] flex items-center gap-2">
                          <span className="font-semibold">{item.quantity} {item.unit}</span>
                          <span>•</span>
                          <span className="text-[#3a2a1d] font-bold">{item.category}</span>
                        </div>

                        <div className="text-[10px] text-[#7a6b5f] flex items-center gap-2 pt-0.5">
                          <span>Expiry: <strong className="text-[#2a201b]">{item.expiryDate}</strong></span>
                          {item.manufacturedDate && (
                            <>
                              <span>•</span>
                              <span>Mfg: {item.manufacturedDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Go to Recipe & Edit / Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-[#6b5b50] hover:text-[#3a2a1d] hover:bg-[#fffdf7]/80 rounded-lg transition"
                          title="Edit Quantity / Expiry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/pantry?id=${item.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                await syncPantryFromDb();
                                showToast(`Removed ${item.name} from Pantry.`);
                              } else {
                                showToast('Failed to delete item.');
                              }
                            } catch (e) {
                              showToast('Error deleting item.');
                            }
                          }}
                          className="p-1.5 text-[#6b5b50] hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition"
                          title="Delete / Used Up"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Per-Item CTA: Go to Recipe */}
                    <div className="mt-2.5 pt-2 border-t border-[#c8b49e]/30 flex items-center justify-between">
                      <span className="text-[10px] text-[#6b5b50]">
                        Use before spoilage to prevent waste
                      </span>
                      <button
                        onClick={() => handleGoToRecipeForItem(item)}
                        className="px-3 py-1 bg-[#3a2a1d]/85 hover:bg-[#3a2a1d] text-[#fcfaf5] text-[11px] font-bold rounded-xl flex items-center gap-1 transition shadow-sm"
                      >
                        <ChefHat className="w-3 h-3 text-[#f5d7a6]" />
                        Go to Recipe
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 3: PANTRY RECIPES */}
      {activeTab === 'recipes' && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 bg-[#fffdf7]/70 backdrop-blur-md rounded-3xl border border-[#b8a48e] shadow-sm text-center">
            <ChefHat className="w-8 h-8 text-[#3a2a1d] mx-auto mb-2" />
            <h2 className="text-sm font-bold text-[#2a201b]">Zero-Waste Pantry Recipes</h2>
            <p className="text-xs text-[#6b5b50] mt-1 max-w-xs mx-auto">
              Generate instant vegetarian recipes using all <strong>{pantryItems.filter(p => getDaysLeft(p.expiryDate) >= 0).length} fresh items</strong> currently stored in your Pantry!
            </p>

            <button
              onClick={handleGeneratePantryRecipes}
              disabled={isGenerating || pantryItems.filter(p => getDaysLeft(p.expiryDate) >= 0).length === 0}
              className="mt-4 w-full py-3.5 px-4 bg-[#3a2a1d]/90 hover:bg-[#3a2a1d] text-[#fcfaf5] font-bold rounded-2xl shadow-lg border border-[#5a4636] flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#f5d7a6]" />
              {isGenerating ? 'Cooking up recipes...' : `Generate Recipes from Pantry (${pantryItems.filter(p => getDaysLeft(p.expiryDate) >= 0).length} items)`}
            </button>
          </div>
        </motion.div>
      )}

      {/* EDIT ITEM MODAL */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#fffdf7] border border-[#b8a48e] w-full max-w-xs rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#e8dfd0] pb-2">
                <h3 className="text-sm font-bold text-[#2a201b]">Edit Pantry Item</h3>
                <button onClick={() => setEditingItem(null)} className="p-1 text-[#6b5b50] hover:text-[#2a201b]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#3a2a1d] mb-1">Item Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-[#faf6ed] border border-[#b8a48e] rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#3a2a1d] mb-1">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 1 })}
                      className="w-full bg-[#faf6ed] border border-[#b8a48e] rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#3a2a1d] mb-1">Unit</label>
                    <select
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value as MetricUnit })}
                      className="w-full bg-[#faf6ed] border border-[#b8a48e] rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {METRIC_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#3a2a1d] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                    className="w-full bg-[#faf6ed] border border-[#b8a48e] rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#6b5b50] hover:text-[#2a201b]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/pantry', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: editingItem.id,
                          name: editingItem.name,
                          quantity: editingItem.quantity,
                          unit: editingItem.unit,
                          category: editingItem.category,
                          expiryDate: editingItem.expiryDate
                        })
                      });
                      if (res.ok) {
                        await syncPantryFromDb();
                        showToast(`Updated ${editingItem.name}!`);
                        setEditingItem(null);
                      } else {
                        showToast('Failed to update item.');
                      }
                    } catch (e) {
                      showToast('Error updating item.');
                    }
                  }}
                  className="px-4 py-1.5 bg-[#3a2a1d] text-[#fcfaf5] text-xs font-bold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
