'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Package, ArrowRight, Menu, X, BarChart2, Bookmark, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';
import { SignInButton, Show, UserButton, useUser } from '@clerk/nextjs';

const emptySubscribe = () => () => { };
const useHasMounted = () =>
  React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

export const LandingView: React.FC = () => {
  const { setStep, syncPreferencesFromDb } = useAppStore();
  const hasMounted = useHasMounted();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      syncPreferencesFromDb();
    }
  }, [isSignedIn, syncPreferencesFromDb]);

  const handleSavedRecipes = () => {
    setStep('saved_recipes');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[92vh] py-6 px-3 relative z-10">

      {/* Header with Brand Logo & Clerk User Profile */}
      <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-[#c8b49e]/60 mb-2 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 text-[#3a2a1d] hover:bg-[#fffdf7]/50 rounded-xl transition active:scale-95 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
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

      {/* Side Drawer Overlay for Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-[#2a201b]/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#faf6ed] shadow-2xl z-50 flex flex-col border-r border-[#c8b49e]/50"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#c8b49e]/50">
                <h2 className="text-lg font-black text-[#2a201b]">Menu</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 bg-[#efe8da] text-[#3a2a1d] rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setStep('how_to_cook');
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-[#fffdf7] hover:bg-[#efe8da] border border-[#c8b49e]/60 rounded-2xl transition shadow-sm"
                >
                  <div className="p-2 bg-[#efe8da] rounded-xl text-[#3a2a1d]">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-[#3a2a1d]">How to Cook</span>
                </button>

                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setStep('statistics');
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-[#fffdf7] hover:bg-[#efe8da] border border-[#c8b49e]/60 rounded-2xl transition shadow-sm"
                >
                  <div className="p-2 bg-[#efe8da] rounded-xl text-[#3a2a1d]">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#3a2a1d]">Statistics & Insights</span>
                </button>

                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setStep('settings');
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-[#fffdf7] hover:bg-[#efe8da] border border-[#c8b49e]/60 rounded-2xl transition shadow-sm"
                >
                  <div className="p-2 bg-[#efe8da] rounded-xl text-[#3a2a1d]">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#3a2a1d]">Settings & Preferences</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Hero Card: Static Composite Hero Image */}
      <div className="w-full max-w-sm px-4 py-5 bg-[#fffdf7]/30 backdrop-blur-md border border-[#c8b49e]/50 rounded-3xl shadow-sm flex flex-col items-center text-center mt-2">
        <div className="w-full max-w-[320px] aspect-[4/3] relative flex items-center justify-center">
          <Image
            src="/punarjeevann-full-hero.png"
            alt="PunarJeevAnn"
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Main Canvas Area: Translucent Action Buttons */}
      <div className="w-full max-w-sm space-y-3.5 my-auto relative z-10 pt-4">
        {/* Primary Action: Generate Recipes */}
        <button
          onClick={() => setStep('manual_input')}
          className="w-full p-4 bg-[#3a2a1d]/90 backdrop-blur-md border border-[#5a4636] text-[#fcfaf5] rounded-3xl text-left flex items-center justify-between group shadow-lg transition-all active:scale-[0.98] hover:bg-[#3a2a1d]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#fffdf7]/15 border border-[#fffdf7]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#f5d7a6]" />
            </div>
            <div>
              <span className="text-base font-bold block leading-snug">
                Generate Recipes
              </span>
              <span className="text-[11px] text-[#e0d3c1] block">
                Type text or scan fridge with camera
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#f5d7a6] group-hover:translate-x-1 transition shrink-0 ml-2" />
        </button>

        {/* Secondary Action: Go to Pantry */}
        <button
          onClick={() => setStep('pantry')}
          className="w-full p-4 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-3xl text-left flex items-center justify-between group shadow-md transition-all active:scale-[0.98] hover:bg-[#fffdf7]/50 hover:border-[#3a2a1d]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3a2a1d]/10 border border-[#3a2a1d]/15 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-[#3a2a1d]" />
            </div>
            <div>
              <span className="text-base font-bold text-[#2a201b] block leading-snug">
                Go to Pantry
              </span>
              <span className="text-[11px] text-[#6b5b50] block">
                Track ingredients & expiry alerts
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#3a2a1d] group-hover:translate-x-1 transition shrink-0 ml-2" />
        </button>

        {/* Tertiary Action: Saved Recipes */}
        <button
          onClick={handleSavedRecipes}
          className="w-full p-4 bg-[#fffdf7]/30 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-3xl text-left flex items-center justify-between group shadow-md transition-all active:scale-[0.98] hover:bg-[#fffdf7]/50 hover:border-[#3a2a1d]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3a2a1d]/10 border border-[#3a2a1d]/15 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 text-[#3a2a1d]" />
            </div>
            <div>
              <span className="text-base font-bold text-[#2a201b] block leading-snug">
                Saved Recipes
              </span>
              <span className="text-[11px] text-[#6b5b50] block">
                {isSignedIn ? 'Your bookmarked recipe collection' : 'Sign in to view saved recipes'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#3a2a1d] group-hover:translate-x-1 transition shrink-0 ml-2" />
        </button>
      </div>

      {/* Footer balance spacer */}
      <div className="h-2" />
    </div>
  );
};
