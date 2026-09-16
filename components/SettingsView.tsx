import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PREFERENCE_CATEGORIES = [
  {
    title: 'Nutrition Goals',
    options: [
      'High Protein', 'High Fiber', 'Calcium Rich', 'Magnesium Rich', 
      'Iron Rich', 'Omega-3 Rich', 'Vitamin B12 Focused', 'Vitamin D Focused', 
      'Vitamin C Rich', 'Folate Rich', 'Potassium Rich', 'Low Sodium', 
      'Healthy Fats', 'Heart Healthy', 'Bone Support', 'Antioxidant Rich'
    ]
  },
  {
    title: 'Health-Oriented Preferences',
    options: [
      'Diabetes-Friendly', 'Heart-Friendly', 'Low-Sodium', 'Lower Added Sugar', 
      'Gluten-Free', 'Lactose-Free', 'Allergy-Aware', 'Plant-Based', 
      'Whole-Food Focused', 'Low-Processed', 'Balanced Nutrition'
    ]
  },
  {
    title: 'Body / Lifestyle Goals',
    options: [
      'Lower Calorie', 'Muscle Building', 'Fitness / Active Lifestyle', 
      'Weight Maintenance', 'Higher Energy', 'Sleep-Friendly', 'Focus-Friendly', 
      'Light Meals', 'High Satiety', 'Quick Energy', 'Post-Workout', 'Late-Night Light Meal'
    ]
  },
  {
    title: 'Sustainability Preferences',
    options: [
      'Maximum Food Rescue', 'Low Environmental Impact', 'Low Water Footprint', 
      'Low Carbon Footprint', 'Use More Leftovers', 'Zero-Waste Priority', 
      'Minimal New Ingredients', 'Budget-Friendly', 'Use What I Already Have'
    ]
  },
  {
    title: 'Cooking Preferences',
    options: [
      'Under 15 Minutes', 'One-Pot', 'Beginner-Friendly', 'Advanced Cooking', 
      'No-Oven', 'Minimal Cleanup', 'Budget Ingredients', 'Spicy', 
      'Mild', 'Low Salt', 'Comfort Food', 'Fresh & Light', 
      'Traditional / Regional', 'International', 'Meal Prep Friendly', 'Family-Friendly'
    ]
  }
];

export const SettingsView: React.FC = () => {
  const { setStep, userPreferences, setUserPreferences, showToast } = useAppStore();
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    setSelectedTags(userPreferences.selectedPreferences || []);
    setCustomText(userPreferences.customPreferences || '');
  }, [userPreferences]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = () => {
    setUserPreferences({
      selectedPreferences: selectedTags,
      customPreferences: customText
    });
    showToast('Preferences saved successfully!');
    setStep('landing');
  };

  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-[#faf6ed]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-[#fffdf7]/80 backdrop-blur-md border-b border-[#c8b49e]/60">
        <button
          onClick={() => setStep('landing')}
          className="p-2 bg-[#efe8da] hover:bg-[#e4dccb] text-[#3a2a1d] rounded-full transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-[#2a201b]">Settings & Preferences</h1>
        <button
          onClick={handleSave}
          className="p-2 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] rounded-full transition active:scale-95"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6 pb-24">
        
        <div className="bg-[#fffdf7] p-4 rounded-2xl border border-[#c8b49e]/60 shadow-sm">
          <h2 className="text-sm font-bold text-[#3a2a1d] mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Custom Preferences
          </h2>
          <p className="text-xs text-[#6b5b50] mb-3">
            Add any specific dietary notes or custom preferences you want the AI to prioritize.
          </p>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. I prefer non-spicy food, I'm allergic to peanuts..."
            className="w-full bg-[#f4f0e6] border border-[#c8b49e] rounded-xl p-3 text-sm text-[#2a201b] focus:outline-none focus:ring-2 focus:ring-[#3a2a1d]/50 resize-none h-24"
          />
        </div>

        {PREFERENCE_CATEGORIES.map((category, idx) => (
          <div key={idx} className="bg-[#fffdf7] p-4 rounded-2xl border border-[#c8b49e]/60 shadow-sm">
            <h2 className="text-sm font-bold text-[#3a2a1d] mb-3">{category.title}</h2>
            <div className="flex flex-wrap gap-2">
              {category.options.map((option, optIdx) => {
                const isSelected = selectedTags.includes(option);
                return (
                  <button
                    key={optIdx}
                    onClick={() => toggleTag(option)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 border ${
                      isSelected 
                        ? 'bg-[#3a2a1d] text-[#fcfaf5] border-[#3a2a1d] shadow-md' 
                        : 'bg-[#efe8da] text-[#5a4636] border-transparent hover:border-[#c8b49e]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
      </div>
      
      {/* Floating Save Button */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 px-4 z-20 max-w-[480px] mx-auto"
      >
        <button
          onClick={handleSave}
          className="w-full py-4 bg-[#3a2a1d] hover:bg-[#2a201b] text-[#fcfaf5] rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 border border-[#5a4636]"
        >
          <Save className="w-5 h-5" /> Save Preferences
        </button>
      </motion.div>
    </div>
  );
};
