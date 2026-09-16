'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const CookingLoadingView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6">
      {/* Cute Animated Tossing Pan SVG */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <motion.svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
          {/* The Food tossing up */}
          <motion.g
            animate={{ y: [0, -50, 0], x: [0, -10, 0], rotate: [0, -180, -360] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
            style={{ originX: 0.35, originY: 0.5 }}
          >
            {/* Green Veggie */}
            <circle cx="35" cy="50" r="7" fill="#8cb86d" />
            {/* Golden Cube (Paneer/Tofu) */}
            <rect x="42" y="42" width="10" height="10" rx="2" fill="#e8cc9b" />
            {/* Tomato / Carrot slice */}
            <circle cx="28" cy="46" r="5" fill="#e09b91" />
          </motion.g>

          {/* The Pan */}
          <motion.g
            animate={{ rotate: [0, -20, 0], y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            style={{ originX: 0.7, originY: 0.6 }}
          >
            {/* Pan Base */}
            <path d="M10,55 Q10,75 35,75 Q60,75 60,55 Z" fill="#2a201b" />
            {/* Pan Handle */}
            <path d="M58,58 L90,48" stroke="#2a201b" strokeWidth="7" strokeLinecap="round" />
            {/* Pan Highlight for glossy effect */}
            <path d="M15,57 Q15,70 35,70" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </motion.g>
        </motion.svg>
      </div>

      <div className="space-y-2 mt-4">
        <h2 className="text-2xl font-black text-[#2a201b] flex items-center justify-center gap-2">
          Cooking Up Recipes...
          <Sparkles className="w-6 h-6 text-[#c88d3e] animate-spin" />
        </h2>
        <p className="text-sm text-[#5a4636] max-w-sm mx-auto font-bold">
          Tossing up your leftovers into 100% vegetarian recipes & calculating eco impact scores!
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex gap-2 justify-center pt-4">
        <div className="w-3 h-3 rounded-full bg-[#8cb86d] animate-bounce"></div>
        <div className="w-3 h-3 rounded-full bg-[#e8cc9b] animate-bounce delay-150"></div>
        <div className="w-3 h-3 rounded-full bg-[#e09b91] animate-bounce delay-300"></div>
      </div>
    </div>
  );
};
