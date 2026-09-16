import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDbUser } from '@/lib/userHelper';
import { auth } from '@clerk/nextjs/server';

const CATEGORY_OPTIONS = [
  'Vegetables & Greens', 'Fruits', 'Dairy & Plant-Milk',
  'Grains & Rice', 'Legumes & Pulses', 'Spices & Seasonings',
  'Condiments & Sauces', 'Nuts & Seeds', 'Other Staples'
];

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const dbUser = await getOrCreateDbUser(clerkUserId);
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Filter by date range if provided
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const whereClause: any = { userId: dbUser.id };
    if (startDate || endDate) {
      whereClause.expiryDate = dateFilter;
    }

    const allItems = await prisma.pantryItem.findMany({
      where: whereClause
    });

    const expiredItemsData = allItems.filter(i => i.expiryDate && i.expiryDate < todayStr).map(i => ({
      name: i.name, category: i.category, expiryDate: i.expiryDate
    }));

    const CATEGORY_COLORS: Record<string, string> = {
      'Vegetables & Greens': '#10b981', // emerald
      'Fruits': '#f59e0b', // amber
      'Dairy & Plant-Milk': '#3b82f6', // blue
      'Grains & Rice': '#eab308', // yellow
      'Legumes & Pulses': '#f97316', // orange
      'Spices & Seasonings': '#ef4444', // red
      'Condiments & Sauces': '#8b5cf6', // purple
      'Nuts & Seeds': '#6366f1', // indigo
      'Other Staples': '#6b7280' // gray
    };

    const barChart = CATEGORY_OPTIONS.map(cat => {
      const itemsInCat = allItems.filter(i => i.category === cat);
      const total = itemsInCat.length;
      if (total === 0) return { category: cat, efficiency: 100 };
      
      const expiredCount = itemsInCat.filter(i => i.expiryDate && i.expiryDate < todayStr).length;
      const freshCount = total - expiredCount;
      const efficiency = Math.round((freshCount / total) * 100);
      return { category: cat, efficiency };
    });

    const totalExpired = expiredItemsData.length;
    const donutChart: { category: string; percentage: number; color: string }[] = [];
    if (totalExpired > 0) {
       CATEGORY_OPTIONS.forEach(cat => {
          const expiredInCat = expiredItemsData.filter(i => i.category === cat).length;
          if (expiredInCat > 0) {
            const percentage = Math.round((expiredInCat / totalExpired) * 100);
            donutChart.push({ category: cat, percentage, color: CATEGORY_COLORS[cat] || '#000000' });
          }
       });
    } else {
       // if zero waste, just return an empty donut chart
    }

    const prompt = `
      You are an AI analyzing food waste in a user's pantry.
      The user has the following expired items: ${JSON.stringify(expiredItemsData)}.
      If the array is empty, it means the user has zero food waste currently (which is great).
      
      Return a JSON object containing insights matching this TypeScript interface exactly:
      {
        "patternAnalysis": {
          "primaryConcern": string,
          "wasteShare": number,
          "patternText": string,
          "recommendations": string[]
        },
        "predictiveInsights": {
          "currentWasteRate": number,
          "riskLevel": "Low" | "Medium" | "High",
          "predictionText": string,
          "financial": { "currentLoss": number, "monthlyProjection": number, "annualRisk": number },
          "efficiencyScore": number
        }
      }
      
      Ensure the numbers make sense based on the expired items. If the user has zero expired items, output extremely positive feedback for recommendations and patternText, zero waste share, 0 currentWasteRate, 'Low' riskLevel, 0 financial loss, and 100 efficiencyScore.
    `;

    let aiData = {
      patternAnalysis: {
        primaryConcern: 'AI Insights Offline',
        wasteShare: 0,
        patternText: 'Could not connect to Gemini AI to analyze your pattern.',
        recommendations: ['Check API key or network connection.']
      },
      predictiveInsights: {
        currentWasteRate: 0,
        riskLevel: 'Low',
        predictionText: 'Prediction unavailable.',
        financial: { currentLoss: 0, monthlyProjection: 0, annualRisk: 0 },
        efficiencyScore: 0
      }
    };

    try {
      if (process.env.GEMINI_API_KEY) {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            aiData = JSON.parse(responseText);
          }
        } else {
          console.error('Gemini API returned error status:', geminiRes.status);
        }
      }
    } catch (aiErr) {
      console.error('Gemini API Error in Statistics:', aiErr);
    }

    return NextResponse.json({
      ...aiData,
      donutChart,
      barChart,
      expiredItems: expiredItemsData
    });

  } catch (error) {
    console.error('Statistics API Database Error:', error);
    // Outer catch means Prisma or Auth failed!
    return NextResponse.json({
      donutChart: [],
      barChart: [],
      expiredItems: [],
      patternAnalysis: {
        primaryConcern: 'Database Error',
        wasteShare: 0,
        patternText: 'Failed to connect to your database.',
        recommendations: []
      },
      predictiveInsights: {
        currentWasteRate: 0,
        riskLevel: 'High',
        predictionText: 'Database error occurred.',
        financial: { currentLoss: 0, monthlyProjection: 0, annualRisk: 0 },
        efficiencyScore: 0
      }
    });
  }
}
