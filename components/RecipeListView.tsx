'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Sparkles, Leaf, BookOpen, Loader2 } from 'lucide-react';
import { RecipeItem } from '@/types';

interface RecipeListViewProps {
  recipes: RecipeItem[];
  onSelectRecipe: (recipe: RecipeItem) => void;
  title?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const RecipeListView: React.FC<RecipeListViewProps> = ({
  recipes,
  onSelectRecipe,
  title,
  emptyMessage = 'No recipes found.',
  emptyIcon,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-[#3a2a1d] animate-spin" />
        <p className="text-sm text-[#6b5b50] font-medium">Loading recipes…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-[#3a2a1d]" />
          <h2 className="text-sm font-black text-[#2a201b] uppercase tracking-wider">{title}</h2>
          <span className="ml-auto text-[11px] text-[#6b5b50] font-medium">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#efe8da] border border-[#b8a48e] flex items-center justify-center">
            {emptyIcon || <BookOpen className="w-7 h-7 text-[#6b5b50]" />}
          </div>
          <p className="text-sm text-[#6b5b50] font-medium max-w-[220px] leading-relaxed">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe, index) => {
            const isBoost = recipe.recipeTier === 'nutrient_boost';
            const ecoScore = recipe.ecoImpact?.ecoScore;

            return (
              <motion.button
                key={recipe.recipeId || index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.3 }}
                onClick={() => onSelectRecipe(recipe)}
                className="w-full text-left p-4 bg-[#fffdf7]/50 backdrop-blur-md border border-[#b8a48e] rounded-2xl shadow-sm hover:border-[#3a2a1d]/50 hover:bg-[#fffdf7]/80 active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Left accent icon */}
                  <div className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${
                    isBoost 
                      ? 'bg-[#efe8da] border-[#b8a48e]' 
                      : 'bg-[#3a2a1d]/8 border-[#3a2a1d]/15'
                  }`}>
                    {isBoost 
                      ? <Sparkles className="w-5 h-5 text-[#c88d3e]" />
                      : <Leaf className="w-5 h-5 text-[#3a2a1d]" />
                    }
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        isBoost 
                          ? 'bg-[#efe8da] text-[#3a2a1d] border-[#b8a48e]'
                          : 'bg-[#3a2a1d]/10 text-[#3a2a1d] border-[#3a2a1d]/20'
                      }`}>
                        {isBoost ? '✦ Nutrient Boost' : '✓ Fridge Staple'}
                      </span>
                      {ecoScore !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#283d23]/15 text-[#283d23] border border-[#527347]/30">
                          🌿 Eco {ecoScore}/100
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#2a201b] truncate leading-tight">{recipe.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-[#c88d3e]" />
                      <span className="text-[10px] text-[#6b5b50]">{recipe.prepTimeMinutes} min prep</span>
                      {recipe.usedIngredients?.length > 0 && (
                        <>
                          <span className="text-[#b8a48e] text-[10px]">·</span>
                          <span className="text-[10px] text-[#6b5b50]">{recipe.usedIngredients.length} ingredients</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-[#b8a48e] group-hover:text-[#3a2a1d] group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
