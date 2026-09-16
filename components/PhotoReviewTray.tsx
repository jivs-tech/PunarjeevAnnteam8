'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';

import { calculateLogicalExpiryDate } from '@/lib/pantryExpiryHelper';
import { PantryItem, IngredientItem } from '@/types';

export const PhotoReviewTray: React.FC = () => {
  const { 
    photos, 
    removePhoto, 
    clearPhotos, 
    setStep, 
    scanContext,
    addIngredients, 
    addPantryItems,
    showToast 
  } = useAppStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const handleRunVisionOCR = async () => {
    if (photos.length === 0) {
      setStep(scanContext === 'pantry' ? 'pantry' : 'editable_list');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(20);

    try {
      setAnalysisProgress(50);

      const response = await fetch('/api/vision/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: photos.map((p) => {
            const match = p.base64Data.match(/^data:(image\/\w+);base64,/);
            return {
              mimeType: match ? match[1] : 'image/jpeg',
              base64Data: p.base64Data
            };
          })
        })
      });

      setAnalysisProgress(80);
      const data = await response.json();

      if (data.status === 'success' && data.detectedIngredients && data.detectedIngredients.length > 0) {
        if (scanContext === 'pantry') {
          const pantryItemsToAdd: PantryItem[] = data.detectedIngredients.map((item: IngredientItem, idx: number) => ({
            id: 'pantry_scan_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now() + '_' + idx,
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'pcs',
            category: item.category || 'Other Staples',
            expiryDate: calculateLogicalExpiryDate(item.name, item.category),
            addedAt: Date.now(),
            source: 'camera_vision' as const
          }));

          addPantryItems(pantryItemsToAdd);
          showToast(`Added ${pantryItemsToAdd.length} scanned item(s) to Pantry!`);
          clearPhotos();
          setStep('pantry');
          return;
        } else {
          addIngredients(data.detectedIngredients);
          showToast(`Detected ${data.detectedIngredients.length} ingredients from ${photos.length} photos!`);
          clearPhotos();
          setStep('editable_list');
          return;
        }
      } else {
        showToast(data.message || 'No food ingredients detected in captured photos.');
      }
    } catch {
      showToast('Vision API timeout. You can edit items manually.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      setStep(scanContext === 'pantry' ? 'pantry' : 'editable_list');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-28 relative z-10">
      {/* Translucent Header with Navigation & Brand Logo */}
      <div className="flex items-center justify-between py-3 border-b border-[#c8b49e]/60 mb-6 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('camera_scan')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Camera"
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
              <h1 className="text-base font-black text-[#2a201b] leading-tight">
                PunarJeevAnn
              </h1>
              <p className="text-[10px] text-[#6b5b50]">Review captured fridge photos</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep('camera_scan')}
          className="px-3 py-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] text-xs font-bold rounded-xl border border-[#b8a48e] flex items-center gap-1 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add More
        </button>
      </div>

      {/* Grid of Captured Photos */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-2xl overflow-hidden border-[1.5px] border-[#b8a48e] bg-[#fffdf7]/30 group shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.blobUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badge Number */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#3a2a1d]/90 text-[#fcfaf5] border border-[#b8a48e] rounded-md text-[10px] font-bold">
                #{index + 1}
              </div>

              {/* Delete Button Overlay */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition shadow-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add More Photos (+ Tile) */}
        {photos.length < 5 && (
          <button
            onClick={() => setStep('camera_scan')}
            className="aspect-square rounded-2xl border-2 border-dashed border-[#b8a48e] hover:border-[#3a2a1d] bg-[#fffdf7]/30 hover:bg-[#fffdf7]/50 flex flex-col items-center justify-center gap-1 text-[#3a2a1d] transition backdrop-blur-md shadow-sm"
          >
            <Plus className="w-6 h-6 text-[#3a2a1d]" />
            <span className="text-xs font-bold">Add Photo</span>
            <span className="text-[10px] text-[#6b5b50]">{5 - photos.length} left</span>
          </button>
        )}
      </div>

      {/* Analysis Overlay Loader */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#faf6ed]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#3a2a1d] animate-spin" />
              <Sparkles className="w-5 h-5 text-[#c88d3e] absolute top-0 right-0 animate-bounce" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#2a201b]">Analyzing Fridge Photos...</h2>
              <p className="text-xs text-[#6b5b50] mt-1">
                Scanning ingredients & estimating quantities
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs bg-[#e6ded0] h-2 rounded-full overflow-hidden border border-[#b8a48e]">
              <div
                className="bg-[#3a2a1d] h-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Action Footer */}
      {photos.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-[#f7f3eb]/30 backdrop-blur-md border-t border-[#c8b49e] z-30 flex items-center gap-3">
          <button
            onClick={clearPhotos}
            className="px-4 py-3 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] text-xs font-bold rounded-2xl border border-[#b8a48e] transition shadow-sm"
          >
            Clear All
          </button>

          <button
            onClick={handleRunVisionOCR}
            disabled={isAnalyzing}
            className="flex-1 py-3.5 px-4 bg-[#3a2a1d]/90 backdrop-blur-md hover:bg-[#3a2a1d] active:scale-[0.99] text-[#fcfaf5] font-bold rounded-2xl shadow-lg border border-[#5a4636] flex items-center justify-center gap-2 text-xs transition"
          >
            <Sparkles className="w-4 h-4 text-[#c88d3e]" />
            View List & Extract Ingredients
          </button>
        </div>
      )}
    </div>
  );
};
