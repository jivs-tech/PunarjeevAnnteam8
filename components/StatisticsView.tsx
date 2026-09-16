'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Loader2, BarChart3, AlertCircle } from 'lucide-react';

interface ExpiryItem {
  name: string;
  category: string;
  expiryDate: string;
}

interface StatisticsData {
  donutChart: { category: string; percentage: number; color: string }[];
  barChart: { category: string; efficiency: number }[];
  expiredItems: ExpiryItem[];
  patternAnalysis: {
    primaryConcern: string;
    wasteShare: number;
    patternText: string;
    recommendations: string[];
  };
  predictiveInsights: {
    currentWasteRate: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    predictionText: string;
    financial: { currentLoss: number; monthlyProjection: number; annualRisk: number };
    efficiencyScore: number;
  };
}

export const StatisticsView: React.FC = () => {
  const { setStep } = useAppStore();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedTable, setExpandedTable] = useState(false);

  const fetchStatistics = () => {
    setLoading(true);
    setError(false);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    fetch(`/api/statistics?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[92vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3a2a1d] mb-4" />
        <p className="text-[#3a2a1d] font-bold text-sm">Generating AI Insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[92vh] px-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-[#3a2a1d] font-bold">Failed to load statistics.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#3a2a1d] text-white rounded-lg">Retry</button>
      </div>
    );
  }

  const { donutChart, barChart, expiredItems, patternAnalysis, predictiveInsights } = data;

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 pb-24 text-[#2a201b]">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('landing')}
            className="p-2 bg-[#fffdf7] hover:bg-[#efe8da] border border-[#c8b49e] rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#4a90e2]" />
            Category Performance
          </h1>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <label className="block text-gray-500 font-bold mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#3a2a1d]" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-500 font-bold mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#3a2a1d]" 
            />
          </div>
        </div>
        <button 
          onClick={fetchStatistics}
          className="w-full bg-[#3a2a1d] text-white font-bold py-2 rounded-lg text-sm transition hover:bg-[#5a4636]"
        >
          Apply Filter
        </button>
      </div>

      {/* Row 1: Charts (Stacks vertically on mobile) */}
      <div className="flex flex-col gap-4 mb-8">

        {/* Left Card: Waste Distribution by Category */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 flex flex-col items-center relative">
          <h2 className="text-sm font-semibold mb-6 self-start w-full border-b pb-2">Waste Distribution by Category</h2>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
              {(() => {
                const chartData = donutChart.length > 0 ? donutChart : [{ category: 'Zero Waste', percentage: 100, color: '#10b981' }];
                return chartData.map((slice, i) => {
                  let cumulativePercent = 0;
                  for (let j = 0; j < i; j++) {
                    cumulativePercent += chartData[j].percentage;
                  }

                  const strokeDasharray = `${slice.percentage} ${100 - slice.percentage}`;
                  const strokeDashoffset = 100 - cumulativePercent;

                  return (
                    <circle
                      key={i}
                      cx="21" cy="21" r="15.91549430918954"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="8"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-600 font-medium">{donutChart.length === 0 ? 'Zero Waste' : 'Total Waste'}</span>
              <span className="text-sm font-bold">{donutChart.length === 0 ? '0%' : '100%'}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-medium text-gray-600">
            {donutChart.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Zero Waste
              </div>
            ) : donutChart.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }}></span>
                {d.category} ({d.percentage}%)
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Category Efficiency Rates */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-sm font-semibold mb-6 border-b pb-2">Category Efficiency Rates</h2>

          <div className="flex items-end gap-2 h-48 mt-4 relative">
            <div className="absolute -left-2 top-0 bottom-0 flex flex-col justify-between text-[9px] text-gray-400 py-4 h-full">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            <div className="flex-1 flex items-end justify-between h-full pl-4 pb-4 border-l border-b border-gray-200 overflow-x-auto no-scrollbar gap-2">
              {barChart.map((bar, i) => {
                // Hue varies linearly from 0 (red) to 120 (green) based on efficiency (0-100)
                const hue = bar.efficiency * 1.2;
                // Shorten category names for better display
                const shortCat = bar.category.split(' & ')[0];
                return (
                  <div key={i} className="flex flex-col items-center justify-end w-8 shrink-0 h-full">
                    <span className="text-[8px] text-gray-400 mb-1">{bar.efficiency}%</span>
                    <div
                      className="w-5 rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(bar.efficiency, 3)}%`,
                        backgroundColor: `hsl(${hue}, 90%, 45%)`
                      }}
                    />
                    <span className="text-[8px] text-gray-500 mt-2 -rotate-45 origin-top-left translate-y-2 whitespace-nowrap">
                      {shortCat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expired Products Table */}
      <div className="mb-8">
        <h2 className="text-lg font-black mb-4">Expired Products Table</h2>
        <div 
          className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden cursor-pointer select-none"
          onDoubleClick={() => setExpandedTable(!expandedTable)}
          title="Double tap to expand/collapse"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(expandedTable ? expiredItems : expiredItems.slice(0, 5)).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <span className="text-gray-400">{idx + 1}</span> {item.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-600">{item.expiryDate}</td>
                </tr>
              ))}
              {expiredItems.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4 text-gray-500">No expired items found.</td></tr>
              )}
            </tbody>
          </table>
          {expiredItems.length > 5 && (
            <div className="bg-gray-50 text-center py-2 text-xs font-bold text-gray-500 border-t border-gray-200">
              {expandedTable ? 'Double tap to collapse' : `Double tap to see ${expiredItems.length - 5} more...`}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: AI Insights */}
      <div className="flex flex-col gap-4">

        {/* Pattern Analysis */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ec4899]" /> Pattern Analysis
          </h2>
          <div className="space-y-3 text-xs leading-relaxed text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Primary Concern:</span> {patternAnalysis.primaryConcern} &nbsp;
              <span className="font-semibold text-gray-900">Waste Share:</span> {patternAnalysis.wasteShare}% of total waste
            </p>
            <p>
              <span className="font-semibold text-gray-900">Pattern:</span> {patternAnalysis.patternText}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">AI Recommendations:</h3>
              <ul className="space-y-2">
                {patternAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#6366f1]" /> Predictive Insights
          </h2>
          <div className="space-y-3 text-xs leading-relaxed text-gray-700">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Current Waste Rate:</span> {predictiveInsights.currentWasteRate}%
              <span className="font-semibold text-gray-900 ml-2">Risk Level:</span>
              <span className={`w-2.5 h-2.5 rounded-full ${predictiveInsights.riskLevel === 'High' ? 'bg-red-500' : predictiveInsights.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              {predictiveInsights.riskLevel}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Prediction:</span> {predictiveInsights.predictionText}
            </p>
            <p className="mt-2 pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Financial Impact:</span>
              Current Loss: ₹{predictiveInsights.financial.currentLoss} •
              Monthly Projection: ₹{predictiveInsights.financial.monthlyProjection} •
              Annual Risk: ₹{predictiveInsights.financial.annualRisk}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1">Efficiency Score: {predictiveInsights.efficiencyScore}/100</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${predictiveInsights.efficiencyScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
