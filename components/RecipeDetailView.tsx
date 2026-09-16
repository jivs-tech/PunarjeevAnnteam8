'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Printer,
  Share2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Clock,
  Camera,
  Check,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Gauge,
  PlusCircle,
  Leaf,
  Droplets,
  Car,
  ShowerHead,
  Scale,
  Award,
  Square,
  Play
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RecipeItem } from '@/types';
import Image from 'next/image';
import { ARChefAssistantModal } from '@/components/ARChefAssistantModal';
import confetti from 'canvas-confetti';

export const RecipeDetailView: React.FC = () => {
  const {
    selectedRecipe,
    recipeDetailSource,
    setStep,
    showToast,
    saveRecipeToDb,
    unsaveRecipeFromDb,
    isRecipeSaved,
    savedRecipes
  } = useAppStore();

  const recipe = selectedRecipe as RecipeItem;

  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [showEco, setShowEco] = useState(false);

  // Voice assistant state
  const [activeVoice, setActiveVoice] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningForVoice, setIsListeningForVoice] = useState(false);

  // AR state
  const [showAR, setShowAR] = useState(false);

  const ttsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const currentStepIdxRef = React.useRef(0);
  currentStepIdxRef.current = currentStepIdx;
  const speechRateRef = React.useRef(0.85);
  speechRateRef.current = speechRate;
  const keepListeningRef = React.useRef(false);
  keepListeningRef.current = isListeningForVoice && activeVoice;

  // Check saved state on mount and when savedRecipes changes
  useEffect(() => {
    if (recipe) {
      setIsSaved(isRecipeSaved(recipe.recipeId));
    }
  }, [recipe, savedRecipes, isRecipeSaved]);

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#6b5b50]">No recipe selected.</p>
      </div>
    );
  }

  const isBoost = recipe.recipeTier === 'nutrient_boost' || (recipe.nutrientBoostItems && recipe.nutrientBoostItems.length > 0);

  const handleBack = () => {
    if (recipeDetailSource === 'saved') {
      setStep('saved_recipes');
    } else {
      setStep('recipe_output');
    }
  };

  const handleBookmark = async () => {
    if (savingInProgress) return;
    setSavingInProgress(true);

    if (isSaved) {
      const ok = await unsaveRecipeFromDb(recipe.recipeId, recipe.savedRecipeDbId);
      if (ok) {
        setIsSaved(false);
        showToast('Recipe removed from saved collection.');
      } else {
        showToast('Failed to remove recipe. Please try again.');
      }
    } else {
      const result = await saveRecipeToDb(recipe);
      if (result.success) {
        setIsSaved(true);
        showToast('✅ Recipe saved to your collection!');
        try {
          confetti({ particleCount: 30, spread: 55, origin: { y: 0.4 }, colors: ['#3a2a1d', '#c88d3e', '#f5d7a6'] });
        } catch { /* ignore */ }
      } else if (result.isAuthError) {
        showToast('Please sign in to save recipes to your account.');
      } else {
        showToast(result.message || 'Could not save recipe. Please try again.');
      }
    }
    setSavingInProgress(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareText = `Cook this ${recipe.title} with PunarJeevAnn! 🌿\n\nIngredients: ${recipe.usedIngredients.join(', ')}\n\nSteps:\n${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;
    
    if (navigator.share) {
      navigator.share({
        title: `PunarJeevAnn — ${recipe.title}`,
        text: shareText
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Recipe copied to clipboard!');
    }
  };

  // TTS
  const speakStep = (text: string, stepNum: number) => {
    if (!('speechSynthesis' in window)) { showToast('TTS not supported.'); return; }
    if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
    window.speechSynthesis.cancel();
    const rate = speechRateRef.current;
    const formatted = rate < 0.9 ? `Step ${stepNum}. ... ${text.split('. ').join('. ... ')}` : `Step ${stepNum}. ${text}`;
    const utt = new SpeechSynthesisUtterance(formatted);
    utt.rate = rate; utt.pitch = 1.0;
    ttsUtteranceRef.current = utt;
    setIsSpeaking(true);
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    const estDur = Math.max(3000, formatted.length * (100 / rate));
    ttsTimeoutRef.current = setTimeout(() => setIsSpeaking(false), estDur);
    window.speechSynthesis.speak(utt);
  };

  const startVoice = () => { setActiveVoice(true); setCurrentStepIdx(0); setIsListeningForVoice(true); speakStep(recipe.instructions[0], 1); };
  const closeVoice = () => { if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); ttsUtteranceRef.current = null; setIsSpeaking(false); setIsListeningForVoice(false); setActiveVoice(false); };

  const goNext = () => {
    const idx = currentStepIdxRef.current;
    if (idx < recipe.instructions.length - 1) { const n = idx + 1; setCurrentStepIdx(n); speakStep(recipe.instructions[n], n + 1); }
    else showToast('🎉 All cooking steps complete! Enjoy your meal.');
  };
  const goPrev = () => { const idx = currentStepIdxRef.current; if (idx > 0) { const p = idx - 1; setCurrentStepIdx(p); speakStep(recipe.instructions[p], p + 1); } };

  const goNextRef = React.useRef(goNext); goNextRef.current = goNext;
  const goPrevRef = React.useRef(goPrev); goPrevRef.current = goPrev;

  // Speech recognition
  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let recognition: any = null;
    let restartTimer: any = null;
    if (isListeningForVoice && activeVoice) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          const t = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
          if (/\b(previous|prev|back)\b/i.test(t)) { window.speechSynthesis?.cancel(); showToast('Voice: Previous'); goPrevRef.current(); }
          else if (/\b(next|forward|continue|done)\b/i.test(t)) { window.speechSynthesis?.cancel(); showToast('Voice: Next'); goNextRef.current(); }
          else if (/\b(repeat|replay|again)\b/i.test(t)) { window.speechSynthesis?.cancel(); speakStep(recipe.instructions[currentStepIdxRef.current], currentStepIdxRef.current + 1); }
          else if (/\b(stop|close|exit)\b/i.test(t)) { window.speechSynthesis?.cancel(); setIsListeningForVoice(false); showToast('Voice paused'); }
        };
        recognition.onend = () => { if (keepListeningRef.current) { restartTimer = setTimeout(() => { if (keepListeningRef.current) { try { recognition.start(); } catch { /**/ } } }, 300); } };
        recognition.onerror = () => { /* silent */ };
        try { recognition.start(); } catch { /**/ }
      } else { showToast('Voice recognition not supported.'); setIsListeningForVoice(false); }
    }
    return () => { if (restartTimer) clearTimeout(restartTimer); if (recognition) { try { recognition.stop(); } catch { /**/ } } };
  }, [isListeningForVoice, activeVoice, showToast, recipe]);

  const eco = recipe.ecoImpact;

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-28 relative z-10 print:p-0 print:m-0 print:pb-0 print:text-black">

      {/* =========================================================================
          PRINT-ONLY DOCUMENT HEADER (Visible only when printed onto paper/PDF)
         ========================================================================= */}
      <div className="hidden print:block mb-5 border-b-2 border-gray-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black tracking-widest uppercase text-gray-600 block">
              PunarJeevAnn — Zero-Waste Vegetarian Kitchen
            </span>
            <h1 className="text-2xl font-black text-black mt-0.5 leading-tight">{recipe.title}</h1>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-gray-800 block">Prep Time: {recipe.prepTimeMinutes} mins</span>
            <span className="text-gray-600 block">{isBoost ? 'Nutrient Boost Recipe' : 'Fridge Staple Recipe'}</span>
          </div>
        </div>

        {recipe.ayurvedicPurityTag && (
          <div className="mt-1.5 text-[11px] text-gray-700 italic">
            Ayurvedic Safety: {recipe.ayurvedicPurityTag}
          </div>
        )}
      </div>

      {/* =========================================================================
          SCREEN-ONLY APP HEADER & BUTTONS (Completely hidden during printing)
         ========================================================================= */}
      <div className="flex items-center justify-between py-3 px-3 border-b border-[#c8b49e]/60 mb-4 bg-[#fffdf7]/40 backdrop-blur-md rounded-2xl border mt-2 shadow-sm no-print print:hidden">
        <button
          onClick={handleBack}
          className="p-1.5 bg-[#fffdf7]/60 hover:bg-[#fffdf7] text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 relative shrink-0">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-sm font-black text-[#2a201b]">PunarJeevAnn</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bookmark / Save Button */}
          <button
            onClick={handleBookmark}
            disabled={savingInProgress}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition shadow-sm ${isSaved
              ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#5a4636]'
              : 'bg-[#fffdf7]/40 hover:bg-[#fffdf7]/70 text-[#3a2a1d] border-[#b8a48e]'
              }`}
            title={isSaved ? 'Remove from saved' : 'Save recipe'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-[#f5d7a6]" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-2 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/70 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition shadow-sm"
            title="Print recipe"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/70 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition shadow-sm"
            title="Share recipe"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          RECIPE TITLE & META CARD
         ========================================================================= */}
      <div className="p-5 bg-[#fffdf7]/40 backdrop-blur-md border border-[#b8a48e] rounded-3xl shadow-sm space-y-3 print-clean-card print:border-none print:p-0 print:shadow-none print:bg-transparent">
        {/* Badges row - screen only */}
        <div className="flex flex-wrap gap-1.5 no-print print:hidden">
          {isBoost ? (
            <span className="px-2.5 py-0.5 bg-[#efe8da] text-[#3a2a1d] border border-[#b8a48e] rounded-full text-[10px] font-extrabold flex items-center gap-1">
              <PlusCircle className="w-3 h-3" /> Nutrient-Dense Upgrade
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-[#efe8da]/60 text-[#3a2a1d] border border-[#b8a48e]/60 rounded-full text-[10px] font-bold">
              ✓ 100% Fridge Staple Match
            </span>
          )}
          {recipe.ayurvedicPurityTag && (
            <span className="px-2 py-0.5 bg-[#fffdf7] text-[#6b5b50] border border-[#b8a48e]/50 rounded-full text-[10px] font-bold">
              {recipe.ayurvedicPurityTag}
            </span>
          )}
        </div>

        {/* Title on screen (print has document header) */}
        <h1 className="text-xl font-black text-[#2a201b] leading-snug no-print print:hidden">{recipe.title}</h1>

        <div className="flex items-center gap-2 flex-wrap no-print print:hidden">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#efe8da]/40 text-[#3a2a1d] border border-[#b8a48e]/50 rounded-xl text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#c88d3e]" />
            {recipe.prepTimeMinutes} min prep
          </div>
          {eco?.ecoScore !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#283d23]/15 text-[#283d23] border border-[#527347]/30 rounded-xl text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              Eco Score: {eco.ecoScore}/100
            </div>
          )}
        </div>

        {/* Action Buttons: AR + Voice + YouTube (HIDDEN ON PRINT) */}
        <div className="flex flex-col gap-2 pt-1 no-print print:hidden">
          <button
            onClick={() => setShowAR(true)}
            className="w-full py-3.5 px-2 bg-gradient-to-br from-[#e8cc9b] via-[#d1ad66] to-[#b88c35] text-[#3a2a1d] font-black rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[4px_4px_10px_#d5cebf,-4px_-4px_10px_#ffffff,inset_2px_2px_5px_rgba(255,255,255,0.5),inset_-2px_-2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_4px_4px_8px_#9c7529,inset_-4px_-4px_8px_#f2deb1] active:scale-95"
          >
            <Camera className="w-5 h-5" />
            Cook Buddy
          </button>
          <div className="flex gap-2 w-full">
            <button
              onClick={startVoice}
              className="flex-1 py-2.5 px-2 rounded-2xl bg-gradient-to-br from-[#a6bfd1] via-[#7d9eb5] to-[#597d96] text-[#172c3d] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[4px_4px_10px_#d5cebf,-4px_-4px_10px_#ffffff,inset_2px_2px_5px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_4px_4px_8px_#476880,inset_-4px_-4px_8px_#c2d7e6] active:scale-95 border-none"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Voice Guide
            </button>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.title + " vegetarian recipe tutorial")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-2 rounded-2xl bg-gradient-to-br from-[#e09b91] via-[#c77267] to-[#a64d42] text-[#3d1611] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[4px_4px_10px_#d5cebf,-4px_-4px_10px_#ffffff,inset_2px_2px_5px_rgba(255,255,255,0.3),inset_-2px_-2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_4px_4px_8px_#8c3e34,inset_-4px_-4px_8px_#f5bab3] active:scale-95 border-none"
            >
              <Play className="w-3.5 h-3.5" />
              YouTube Video
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT-ONLY SUMMARY: ECO IMPACT & NUTRITION TABLE
         ========================================================================= */}
      {(eco || recipe.nutritionInfo) && (
        <div className="hidden print:block my-3 p-3.5 border border-gray-400 rounded-lg text-xs print-clean-card">
          <div className="font-bold uppercase tracking-wider text-gray-800 text-[10px] mb-1.5 border-b border-gray-200 pb-1">
            Recipe Overview & Environmental Footprint
          </div>
          <div className="grid grid-cols-2 gap-4">
            {eco && (
              <div>
                <span className="font-bold text-gray-900 block mb-0.5">Eco Sustainability:</span>
                <p className="text-gray-700">
                  CO₂ Saved: <strong>{eco.co2eSavedKg} kg</strong> • Water Saved: <strong>{eco.waterSavedLiters} L</strong>
                  {eco.ecoScore !== undefined && ` • Rating: ${eco.ecoScore}/100`}
                </p>
                {eco.ecoSummary && (
                  <p className="text-[10px] text-gray-600 italic mt-0.5">{eco.ecoSummary}</p>
                )}
              </div>
            )}
            {recipe.nutritionInfo && (
              <div>
                <span className="font-bold text-gray-900 block mb-0.5">Nutrition Facts:</span>
                <p className="text-gray-700">
                  Calories: <strong>{recipe.nutritionInfo.calories}</strong> • Protein: <strong>{recipe.nutritionInfo.protein}</strong> • Carbs: <strong>{recipe.nutritionInfo.carbs}</strong> • Fats: <strong>{recipe.nutritionInfo.fats}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN-ONLY ECO IMPACT EXPANDABLE CARD
         ========================================================================= */}
      {eco && (
        <div className="mt-4 no-print print:hidden">
          <button
            onClick={() => setShowEco(!showEco)}
            className="w-full p-4 bg-gradient-to-br from-[#283d23]/80 via-[#243320] to-[#1c2918] border border-[#527347]/40 rounded-3xl shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#8cb86d]/20 text-[#a8e086] rounded-xl border border-[#8cb86d]/30">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black text-[#f2f5ed] uppercase tracking-wide">Eco-Impact Score</h3>
                {eco.ecoScore !== undefined && (
                  <p className="text-[10px] text-[#a8e086]">{eco.ecoScore}/100 sustainability rating</p>
                )}
              </div>
            </div>
            <span className="text-[10px] text-[#a8e086] font-bold">{showEco ? '▲ Hide' : '▼ Show'}</span>
          </button>

          <AnimatePresence>
            {showEco && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-br from-[#283d23]/70 via-[#243320] to-[#1c2918] border border-[#527347]/40 border-t-0 rounded-b-3xl space-y-3 shadow-xl">
                  {eco.ecoSummary && (
                    <p className="text-xs text-[#d5e0cc] leading-relaxed">{eco.ecoSummary}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#1c2918]/90 border border-[#527347]/30 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-[#8cb86d]">
                        <Leaf className="w-4 h-4" />
                        <span className="text-[10px] text-[#b8c5ad] font-bold uppercase">CO₂ Prevented</span>
                      </div>
                      <div className="text-lg font-black text-[#f2f5ed]">{eco.co2eSavedKg} <span className="text-xs text-[#a8e086] font-normal">kg CO₂e</span></div>
                      {eco.realWorldAnalogs && (
                        <div className="text-[10px] text-[#b8c5ad] flex items-center gap-1">
                          <Car className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>≈ {eco.realWorldAnalogs.drivingAvoidedKm} km driving avoided</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-[#1c2918]/90 border border-[#527347]/30 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-[#9ed47d]">
                        <Droplets className="w-4 h-4" />
                        <span className="text-[10px] text-[#b8c5ad] font-bold uppercase">Water Saved</span>
                      </div>
                      <div className="text-lg font-black text-[#f2f5ed]">{eco.waterSavedLiters} <span className="text-xs text-[#a8e086] font-normal">Liters</span></div>
                      {eco.realWorldAnalogs && (
                        <div className="text-[10px] text-[#b8c5ad] flex items-center gap-1">
                          <ShowerHead className="w-3 h-3 text-[#a8e086] shrink-0" />
                          <span>≈ {eco.realWorldAnalogs.showerMinutesSaved} shower mins</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {eco.wasteDivertedGrams > 0 && (
                    <div className="p-2.5 bg-[#283d23]/40 border border-[#527347]/40 rounded-xl flex items-center justify-between text-xs text-[#d5e0cc]">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#8cb86d]" />
                        <span>Food Mass Rescued:</span>
                      </div>
                      <span className="font-bold text-[#a8e086]">
                        {eco.wasteDivertedGrams >= 1000 ? `${(eco.wasteDivertedGrams / 1000).toFixed(2)} kg` : `${eco.wasteDivertedGrams} g`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Nutrient Boost Tip */}
      {isBoost && recipe.nutrientTip && (
        <div className="mt-4 p-3.5 bg-[#efe8da]/50 border border-[#b8a48e]/60 rounded-2xl text-[11px] text-[#5a4636] flex items-start gap-2 print-clean-card print:my-2">
          <Sparkles className="w-4 h-4 text-[#c88d3e] shrink-0 mt-0.5 no-print print:hidden" />
          <div>
            <strong className="font-bold text-[#3a2a1d] print:text-black">Nutrient-Dense Upgrade: </strong>
            {recipe.nutrientTip}
          </div>
        </div>
      )}

      {/* Nutrition Macros - Screen Only */}
      {recipe.nutritionInfo && (
        <div className="mt-4 grid grid-cols-4 gap-2 p-3 bg-[#fffdf7]/40 border border-[#b8a48e]/50 rounded-2xl text-center text-[11px] no-print print:hidden">
          {[
            { label: 'Calories', val: recipe.nutritionInfo.calories, color: 'text-[#c88d3e]' },
            { label: 'Protein', val: recipe.nutritionInfo.protein, color: 'text-[#3a2a1d]' },
            { label: 'Carbs', val: recipe.nutritionInfo.carbs, color: 'text-[#3a2a1d]' },
            { label: 'Fats', val: recipe.nutritionInfo.fats, color: 'text-[#3a2a1d]' }
          ].map(({ label, val, color }) => (
            <div key={label}>
              <span className="text-[#6b5b50] block text-[9px]">{label}</span>
              <span className={`font-bold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          INGREDIENTS LIST (Printed with clean checkboxes for cooking prep)
         ========================================================================= */}
      <div className="mt-4 p-4 bg-[#fffdf7]/40 border border-[#b8a48e]/50 rounded-2xl space-y-3 print-clean-card print:border-gray-400 print:my-3 print:p-4">
        <h3 className="text-xs font-black text-[#2a201b] uppercase tracking-wide print:text-black print:text-sm print:border-b print:pb-1">
          Ingredients Checklist
        </h3>

        {/* Used Ingredients */}
        <div>
          <span className="text-[11px] text-[#6b5b50] font-semibold block mb-1.5 print:text-black print:text-xs">
            From Your Kitchen:
          </span>
          <div className="flex flex-wrap gap-1.5 print:grid print:grid-cols-2 print:gap-1.5">
            {recipe.usedIngredients.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-[#efe8da]/60 text-[#3a2a1d] border border-[#b8a48e]/60 rounded-lg text-xs font-medium flex items-center gap-1.5 print:bg-transparent print:border-none print:p-0 print:text-black"
              >
                <Check className="w-3 h-3 text-[#3a2a1d] no-print print:hidden" />
                <Square className="w-3.5 h-3.5 text-gray-500 hidden print:inline-block shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pantry Staples */}
        {recipe.pantryStaplesNeeded?.length > 0 && (
          <div>
            <span className="text-[11px] text-[#6b5b50] font-semibold block mb-1.5 print:text-black print:text-xs">
              Pantry Staples:
            </span>
            <div className="flex flex-wrap gap-1.5 print:grid print:grid-cols-2 print:gap-1.5">
              {recipe.pantryStaplesNeeded.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-[#fffdf7] text-[#6b5b50] border border-[#b8a48e]/50 rounded-lg text-xs flex items-center gap-1.5 print:bg-transparent print:border-none print:p-0 print:text-black"
                >
                  <Square className="w-3.5 h-3.5 text-gray-500 hidden print:inline-block shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nutrient Boosts */}
        {recipe.nutrientBoostItems && recipe.nutrientBoostItems.length > 0 && (
          <div>
            <span className="text-[11px] text-[#3a2a1d] font-semibold block mb-1.5 print:text-black print:text-xs">
              Recommended Additions:
            </span>
            <div className="flex flex-wrap gap-1.5 print:grid print:grid-cols-2 print:gap-1.5">
              {recipe.nutrientBoostItems.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-[#efe8da] text-[#3a2a1d] border border-[#b8a48e] rounded-lg text-xs font-bold flex items-center gap-1.5 print:bg-transparent print:border-none print:p-0 print:text-black"
                >
                  <Square className="w-3.5 h-3.5 text-gray-500 hidden print:inline-block shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          COOKING INSTRUCTIONS
         ========================================================================= */}
      <div className="mt-4 p-4 bg-[#fffdf7]/40 border border-[#b8a48e]/50 rounded-2xl space-y-3 print-clean-card print:border-gray-400 print:my-3 print:p-4">
        <h3 className="text-xs font-black text-[#2a201b] uppercase tracking-wide print:text-black print:text-sm print:border-b print:pb-1">
          Step-by-Step Cooking Guide
        </h3>
        <ol className="space-y-3 print:space-y-2">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex gap-3 print:gap-2 items-start">
              <span className="w-6 h-6 shrink-0 rounded-full bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 flex items-center justify-center text-[10px] font-black text-[#3a2a1d] print:border-black print:text-black print:w-5 print:h-5 print:text-xs">
                {idx + 1}
              </span>
              <p className="text-xs text-[#2a201b] leading-relaxed pt-0.5 print:text-black print:text-[11pt] print:leading-normal">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Chef Tip */}
      {recipe.chefTip && (
        <div className="mt-4 p-3.5 bg-[#efe8da]/40 border border-[#b8a48e]/50 rounded-2xl text-[11px] text-[#5a4636] flex items-start gap-2 print-clean-card print:my-3 print:border-gray-400 print:text-black">
          <Sparkles className="w-4 h-4 text-[#c88d3e] shrink-0 mt-0.5 no-print print:hidden" />
          <div>
            <strong className="text-[#3a2a1d] print:text-black font-bold">Chef Zero-Waste Tip: </strong>
            {recipe.chefTip}
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT-ONLY FOOTER
         ========================================================================= */}
      <div className="hidden print:block mt-8 pt-3 border-t border-gray-400 text-center text-[10px] text-gray-600">
        PunarJeevAnn — Zero-Waste Vegetarian Kitchen • Ayurvedic Food Purity Verified • Happy Cooking!
      </div>

      {/* =========================================================================
          FULLSCREEN VOICE COOKING ASSISTANT (Screen only)
         ========================================================================= */}
      <AnimatePresence>
        {activeVoice && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-[#faf6ed]/95 backdrop-blur-xl p-6 flex flex-col justify-between max-w-[480px] mx-auto border-x border-[#dcd4c3] no-print print:hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#b8a48e]/50">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#3a2a1d] tracking-wider block">Hands-Free Voice Guide</span>
                <h3 className="text-sm font-bold text-[#2a201b] truncate max-w-[240px]">{recipe.title}</h3>
              </div>
              <button onClick={closeVoice} className="px-3 py-1.5 bg-[#fffdf7]/50 hover:bg-[#fffdf7] text-[#3a2a1d] border border-[#b8a48e] rounded-xl text-xs font-bold">Close</button>
            </div>

            {/* Speed controls */}
            <div className="p-3 bg-[#fffdf7]/30 border border-[#b8a48e] rounded-2xl flex items-center justify-between my-2 shadow-sm">
              <span className="text-xs font-semibold text-[#3a2a1d] flex items-center gap-1.5">
                <Gauge className="w-4 h-4" /> Audio Speed:
              </span>
              <div className="flex items-center gap-1">
                {[{ label: '0.75x', rate: 0.70 }, { label: '1.0x', rate: 0.95 }, { label: '1.25x', rate: 1.20 }].map((s) => (
                  <button key={s.rate} onClick={() => { setSpeechRate(s.rate); speakStep(recipe.instructions[currentStepIdx], currentStepIdx + 1); }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${speechRate === s.rate ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#5a4636]' : 'bg-[#fffdf7]/60 text-[#6b5b50] border-[#b8a48e]'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step card */}
            <div className="flex-1 flex flex-col justify-center my-4 space-y-6 text-center">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[#efe8da] border border-[#b8a48e] rounded-full text-[#3a2a1d] text-xs font-bold mx-auto">
                Step {currentStepIdx + 1} of {recipe.instructions.length}
              </div>
              <div className="p-6 bg-[#fffdf7]/40 border border-[#b8a48e] rounded-3xl min-h-[160px] flex items-center justify-center shadow-xl">
                <p className="text-base font-bold text-[#2a201b] leading-relaxed">{recipe.instructions[currentStepIdx]}</p>
              </div>
              {/* Mic status */}
              <div className="p-3 bg-[#fffdf7]/30 border border-[#b8a48e] rounded-2xl flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isListeningForVoice ? 'bg-[#3a2a1d]/15 animate-pulse' : 'bg-[#efe8da]'}`}>
                    {isListeningForVoice ? <Mic className="w-4 h-4 text-[#3a2a1d]" /> : <MicOff className="w-4 h-4 text-[#6b5b50]" />}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-[#2a201b] block">{isListeningForVoice ? 'Mic Active' : 'Voice Paused'}</span>
                    <span className="text-[10px] text-[#6b5b50]">{isListeningForVoice ? 'Say "Next", "Previous", "Replay"' : 'Tap to enable voice'}</span>
                  </div>
                </div>
                <button onClick={() => setIsListeningForVoice(!isListeningForVoice)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${isListeningForVoice ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#5a4636]' : 'bg-[#fffdf7]/60 text-[#3a2a1d] border-[#b8a48e]'}`}>
                  {isListeningForVoice ? 'Stop Mic' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button onClick={goPrev} disabled={currentStepIdx === 0} className="py-3 px-3 bg-[#fffdf7]/50 hover:bg-[#fffdf7] border border-[#b8a48e] disabled:opacity-40 text-[#3a2a1d] rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button onClick={() => speakStep(recipe.instructions[currentStepIdx], currentStepIdx + 1)} className="py-3 px-3 bg-[#fffdf7]/70 hover:bg-[#fffdf7] border border-[#b8a48e] text-[#3a2a1d] rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition">
                <Volume2 className="w-4 h-4" /> Replay
              </button>
              <button onClick={goNext} disabled={currentStepIdx === recipe.instructions.length - 1} className="py-3 px-3 bg-[#3a2a1d] hover:bg-[#5a4636] disabled:opacity-40 text-[#fcfaf5] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-md transition">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AR Modal */}
      {showAR && (
        <ARChefAssistantModal recipe={recipe} onClose={() => setShowAR(false)} showToast={showToast} />
      )}

      {/* Sticky footer — only in generated mode with "Start Over" (Screen only) */}
      {recipeDetailSource === 'generated' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-[#faf6ed]/95 backdrop-blur-md border-t border-[#b8a48e] z-30 no-print print:hidden">
          <button
            onClick={() => setStep('recipe_output')}
            className="w-full py-3 px-4 bg-[#fffdf7]/60 hover:bg-[#fffdf7]/90 active:scale-[0.99] text-[#3a2a1d] font-bold rounded-2xl border border-[#b8a48e] flex items-center justify-center gap-2 text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recipe List
          </button>
        </div>
      )}
    </div>
  );
};
