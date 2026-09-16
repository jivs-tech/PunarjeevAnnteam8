'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { LandingView } from '@/components/LandingView';
import { ManualInputView } from '@/components/ManualInputView';
import { CameraScanView } from '@/components/CameraScanView';
import { PhotoReviewTray } from '@/components/PhotoReviewTray';
import { EditableListView } from '@/components/EditableListView';
import { CookingLoadingView } from '@/components/CookingLoadingView';
import { RecipeOutputView } from '@/components/RecipeOutputView';
import { RecipeDetailView } from '@/components/RecipeDetailView';
import { SavedRecipesView } from '@/components/SavedRecipesView';
import { PantryView } from '@/components/PantryView';
import { StatisticsView } from '@/components/StatisticsView';
import { HowToCookView } from '@/components/HowToCookView';
import { SettingsView } from '@/components/SettingsView';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Home() {
  const { currentStep, toastMessage, clearToast } = useAppStore();

  return (
    <main className="min-h-screen bg-[#f4f0e6] text-[#2a201b] font-sans selection:bg-[#3a2a1d] selection:text-[#fcfaf5] coffee-vintage-bg whatsapp-doodle-pattern">
      {/* Mobile-First Canvas Container Capped at 480px with Grain Overlay and WhatsApp Doodle Pattern */}
      <div className="max-w-[480px] mx-auto min-h-screen relative bg-[#faf6ed] border-x border-[#dcd4c3] px-4 shadow-2xl overflow-x-hidden vintage-grain-overlay whatsapp-doodle-pattern z-10">

        {/* Toast Notification Floating Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 12 }}
              exit={{ opacity: 0, y: -40 }}
              className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[88%] max-w-[400px] px-4 py-2.5 bg-[#3a2a1d]/90 text-[#fcfaf5] font-semibold rounded-2xl shadow-xl flex items-center justify-between text-xs backdrop-blur-md border border-[#5a4636]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f5d7a6] shrink-0"></span>
                <span>{toastMessage}</span>
              </div>
              <button onClick={clearToast} className="p-1 hover:bg-[#fffdf7]/15 rounded-lg transition ml-2">
                <X className="w-3.5 h-3.5 text-[#e0d3c1]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Screen Step Renderer */}
        <AnimatePresence mode="wait">
          {currentStep === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingView />
            </motion.div>
          )}

          {currentStep === 'manual_input' && (
            <motion.div key="manual_input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ManualInputView />
            </motion.div>
          )}

          {currentStep === 'camera_scan' && (
            <motion.div key="camera_scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CameraScanView />
            </motion.div>
          )}

          {currentStep === 'photo_review' && (
            <motion.div key="photo_review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PhotoReviewTray />
            </motion.div>
          )}

          {currentStep === 'editable_list' && (
            <motion.div key="editable_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EditableListView />
            </motion.div>
          )}

          {currentStep === 'cooking_loading' && (
            <motion.div key="cooking_loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CookingLoadingView />
            </motion.div>
          )}

          {currentStep === 'recipe_output' && (
            <motion.div key="recipe_output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RecipeOutputView />
            </motion.div>
          )}

          {currentStep === 'recipe_detail' && (
            <motion.div key="recipe_detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <RecipeDetailView />
            </motion.div>
          )}

          {currentStep === 'saved_recipes' && (
            <motion.div key="saved_recipes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SavedRecipesView />
            </motion.div>
          )}

          {currentStep === 'pantry' && (
            <motion.div key="pantry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PantryView />
            </motion.div>
          )}

          {currentStep === 'statistics' && (
            <motion.div key="statistics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatisticsView />
            </motion.div>
          )}
          {currentStep === 'how_to_cook' && (
            <motion.div key="how_to_cook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HowToCookView />
            </motion.div>
          )}

          {currentStep === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
