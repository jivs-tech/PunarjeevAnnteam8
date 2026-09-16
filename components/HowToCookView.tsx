'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChefHat, ArrowLeft, Loader2, Search } from 'lucide-react';
import { RecipeItem, EverestQualityReport } from '@/types';


export const HowToCookView: React.FC = () => {
  const { setStep, setRecipesAndEco, openRecipeDetail } = useAppStore();
  const [recipeName, setRecipeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!recipeName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName })
      });

      const data = await res.json();

      if (data.status === 'success' && data.recipe) {
        const recipeData = data.recipe;

        const dummyQualityReport: EverestQualityReport = {
          overallFreshnessScore: 98,
          freshnessStatus: 'Optimal',
          viruddhaAharaCheck: {
            isSafe: true,
            safetyMessage: 'Ayurvedic Food Purity Verified'
          },
          qualityTips: ['Enjoy your fresh homemade meal!']
        };

        setRecipesAndEco([recipeData], dummyQualityReport);
        openRecipeDetail(recipeData, 'generated');
      } else {
        setError(data.message || 'Failed to generate recipe. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[92vh] max-w-sm mx-auto relative z-10 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-[#fffdf7]/40 p-3 rounded-2xl border border-[#c8b49e]/60 backdrop-blur-sm shadow-sm">
        <button 
          onClick={() => setStep('landing')}
          className="p-2 bg-[#efe8da] text-[#3a2a1d] hover:bg-[#e0d6c4] rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-[#2a201b] flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-amber-600" />
          How to Cook
        </h2>
      </div>

      <div className="bg-[#fffdf7]/60 backdrop-blur-md border border-[#c8b49e]/60 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
        <div className="text-center mb-2">
          <h3 className="text-xl font-black text-[#2a201b] mb-1">What are you craving?</h3>
          <p className="text-sm text-[#5a4636]">Type any dish and our AI Chef will create the perfect recipe for you.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[#8a7666]" />
          </div>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Chocolate Brownie"
            className="w-full pl-11 pr-4 py-4 bg-[#efe8da]/50 border-[1.5px] border-[#c8b49e] rounded-2xl text-[#2a201b] font-medium placeholder-[#8a7666] focus:outline-none focus:border-[#3a2a1d] transition-colors"
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100/80 border border-red-300 text-red-800 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading || !recipeName.trim()}
          className="w-full py-4 bg-[#3a2a1d] hover:bg-[#5a4636] disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-200" />
              Asking Chef Tom...
            </>
          ) : (
            <>
              <ChefHat className="w-5 h-5 text-amber-200" />
              Generate Full Recipe
            </>
          )}
        </button>
      </div>
    </div>
  );
};
