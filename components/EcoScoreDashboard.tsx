'use client';

import React, { useEffect } from 'react';
import { Leaf, Droplets, Car, ShowerHead, Scale, Award } from 'lucide-react';
import { EcoImpact } from '@/types';
import confetti from 'canvas-confetti';

interface EcoScoreDashboardProps {
  ecoImpact: EcoImpact;
}

export const EcoScoreDashboard: React.FC<EcoScoreDashboardProps> = ({ ecoImpact }) => {
  useEffect(() => {
    // Fire celebratory eco confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#8cb86d', '#a8e086', '#d4a359']
      });
    } catch {
      // fallback
    }
  }, []);

  return (
    <div className="p-4 bg-gradient-to-br from-[#283d23]/80 via-[#243320] to-[#1c2918] border border-[#527347]/40 rounded-3xl space-y-4 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#8cb86d]/20 text-[#a8e086] rounded-xl border border-[#8cb86d]/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#f2f5ed] uppercase tracking-wide">
              Your Eco-Impact Saved!
            </h2>
            <p className="text-[11px] text-[#a8e086] font-medium">
              By using your leftovers instead of wasting food
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-[#8cb86d] text-[#131b11] font-black text-[10px] uppercase rounded-full tracking-wider shadow-sm">
          100% Veg Saved
        </span>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* CO2 Metric */}
        <div className="p-3 bg-[#1c2918]/90 border border-[#527347]/30 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8cb86d]">
            <Leaf className="w-4 h-4" />
            <span className="text-[10px] text-[#b8c5ad] font-bold uppercase">GHG Prevented</span>
          </div>
          <div className="text-lg font-black text-[#f2f5ed]">
            {ecoImpact.co2eSavedKg} <span className="text-xs text-[#a8e086] font-normal">kg CO₂e</span>
          </div>
          <div className="text-[10px] text-[#b8c5ad] flex items-center gap-1">
            <Car className="w-3 h-3 text-amber-400 shrink-0" />
            <span>≈ {ecoImpact.realWorldAnalogs.drivingAvoidedKm} km driving avoided</span>
          </div>
        </div>

        {/* Water Metric */}
        <div className="p-3 bg-[#1c2918]/90 border border-[#527347]/30 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#9ed47d]">
            <Droplets className="w-4 h-4" />
            <span className="text-[10px] text-[#b8c5ad] font-bold uppercase">Water Saved</span>
          </div>
          <div className="text-lg font-black text-[#f2f5ed]">
            {ecoImpact.waterSavedLiters} <span className="text-xs text-[#a8e086] font-normal">Liters</span>
          </div>
          <div className="text-[10px] text-[#b8c5ad] flex items-center gap-1">
            <ShowerHead className="w-3 h-3 text-[#a8e086] shrink-0" />
            <span>≈ {ecoImpact.realWorldAnalogs.showerMinutesSaved} shower mins saved</span>
          </div>
        </div>
      </div>

      {/* Mass Diverted Footer */}
      <div className="p-2.5 bg-[#283d23]/40 border border-[#527347]/40 rounded-xl flex items-center justify-between text-xs text-[#d5e0cc]">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#8cb86d]" />
          <span>Total Food Mass Saved:</span>
        </div>
        <span className="font-bold text-[#a8e086]">
          {ecoImpact.wasteDivertedGrams >= 1000 
            ? `${(ecoImpact.wasteDivertedGrams / 1000).toFixed(2)} kg`
            : `${ecoImpact.wasteDivertedGrams} grams`}
        </span>
      </div>
    </div>
  );
};
