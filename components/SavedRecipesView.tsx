'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RecipeListView } from '@/components/RecipeListView';
import { RecipeItem } from '@/types';
import Image from 'next/image';
import { useUser, SignInButton } from '@clerk/nextjs';

export const SavedRecipesView: React.FC = () => {
  const { setStep, savedRecipes, savedRecipesLoading, fetchSavedRecipes, openRecipeDetail } = useAppStore();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSavedRecipes();
    }
  }, [isLoaded, isSignedIn, fetchSavedRecipes]);

  const handleSelectRecipe = (recipe: RecipeItem) => {
    openRecipeDetail(recipe, 'saved');
  };

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-16 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-1 border-b border-[#c8b49e]/60 mb-4 mt-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/60 hover:bg-[#fffdf7] text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative shrink-0">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#2a201b] leading-tight">Saved Recipes</h1>
              <p className="text-[10px] text-[#6b5b50]">Your bookmarked collection</p>
            </div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-[#3a2a1d]/10 border border-[#3a2a1d]/15 flex items-center justify-center">
          <Bookmark className="w-4 h-4 text-[#3a2a1d]" />
        </div>
      </div>

      {/* Auth guard */}
      {isLoaded && !isSignedIn ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center flex-1 py-16 gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-[#efe8da] border border-[#b8a48e] flex items-center justify-center shadow-md">
            <Bookmark className="w-9 h-9 text-[#3a2a1d]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#2a201b] mb-1">Sign In to See Saved Recipes</h2>
            <p className="text-xs text-[#6b5b50] max-w-[220px] leading-relaxed">
              Your saved recipe collection is synced to your account. Sign in to access it.
            </p>
          </div>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-[#3a2a1d] hover:bg-[#5a4636] active:scale-95 text-[#fcfaf5] rounded-2xl text-sm font-bold transition shadow-lg border border-[#5a4636]">
              Sign In to Continue
            </button>
          </SignInButton>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <RecipeListView
            recipes={savedRecipes}
            onSelectRecipe={handleSelectRecipe}
            title="Your Saved Collection"
            emptyMessage="No saved recipes yet. Generate recipes and bookmark the ones you love!"
            emptyIcon={<Bookmark className="w-7 h-7 text-[#6b5b50]" />}
            isLoading={savedRecipesLoading}
          />
        </motion.div>
      )}
    </div>
  );
};
