'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ShieldCheck, Award, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RecipeListView } from '@/components/RecipeListView';
import { RecipeItem } from '@/types';
import Image from 'next/image';

export const RecipeOutputView: React.FC = () => {
  const { recipes, everestQualityReport, resetAll, setStep, openRecipeDetail } = useAppStore();

  const handleSelectRecipe = (recipe: RecipeItem) => {
    openRecipeDetail(recipe, 'generated');
  };

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-28 space-y-4 relative z-10">

      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b border-[#c8b49e]/60 mb-2 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative shrink-0">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-base font-black text-[#2a201b] leading-tight">Generated Recipes</h1>
              <p className="text-[10px] text-[#6b5b50]">Tap a recipe to view details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Everest Quality & Freshness Guard Card */}
      {everestQualityReport && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#fffdf7]/30 backdrop-blur-md border border-[#b8a48e] rounded-3xl space-y-3 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 rounded-xl text-[#3a2a1d]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-[#3a2a1d] tracking-wide flex items-center gap-1.5">
                Everest Food Quality Guard
                <span className="px-2 py-0.5 bg-[#efe8da] text-[#3a2a1d] text-[10px] rounded-full border border-[#b8a48e] font-bold">
                  {everestQualityReport.freshnessStatus} ({everestQualityReport.overallFreshnessScore}%)
                </span>
              </h3>
              <p className="text-[11px] text-[#6b5b50]">Dairy & Freshness Safety Audit</p>
            </div>
          </div>

          {/* Ayurvedic check */}
          <div className="p-2.5 bg-[#fffdf7]/40 border border-[#b8a48e]/50 rounded-2xl text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1 text-[#3a2a1d]">
              <ShieldCheck className="w-4 h-4" />
              Ayurvedic Food Purity (Viruddha Ahara):
            </div>
            <p className="text-[#5a4636] leading-relaxed">
              {everestQualityReport.viruddhaAharaCheck?.safetyMessage || 'No incompatible food combinations detected.'}
            </p>
          </div>

          {everestQualityReport.dairyQualityAnalysis?.isDairyPresent && (
            <div className="p-2.5 bg-[#efe8da]/40 border border-[#b8a48e]/50 rounded-2xl text-[11px] text-[#5a4636] space-y-1">
              <div className="font-bold flex items-center gap-1 text-[#3a2a1d]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Dairy Testing ({everestQualityReport.dairyQualityAnalysis.dairyItemsCount} Dairy Item/s):
              </div>
              <p>{everestQualityReport.dairyQualityAnalysis.recommendedTest}</p>
              <div className="text-[10px] text-[#3a2a1d] font-bold">
                Shelf-Life: {everestQualityReport.dairyQualityAnalysis.shelfLifeEstimate}
              </div>
            </div>
          )}

          <div className="space-y-1 text-[11px] text-[#6b5b50]">
            {everestQualityReport.qualityTips.slice(0, 2).map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[#3a2a1d] font-bold">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recipe List */}
      <RecipeListView
        recipes={recipes}
        onSelectRecipe={handleSelectRecipe}
        title={`Recommended Recipes`}
        emptyMessage="No recipes generated yet. Go back and add some ingredients!"
      />

      {/* Sticky Footer — Reset */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-[#faf6ed]/95 backdrop-blur-md border-t border-[#b8a48e] z-30 print:hidden">
        <button
          onClick={resetAll}
          className="w-full py-3.5 px-4 bg-[#3a2a1d] hover:bg-[#5a4636] active:scale-[0.99] text-[#fcfaf5] font-bold rounded-2xl border border-[#5a4636] shadow-lg flex items-center justify-center gap-2 text-xs transition"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over with New Ingredients
        </button>
      </div>
    </div>
  );
};
