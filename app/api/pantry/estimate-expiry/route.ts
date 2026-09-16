import { NextRequest, NextResponse } from 'next/server';
import { calculateLogicalExpiryDate, getLogicalShelfLifeDays } from '@/lib/pantryExpiryHelper';

/**
 * POST /api/pantry/estimate-expiry
 * API endpoint to dynamically calculate precise logical expiry date for a pantry item using Gemini AI + Ingredient Shelf-Life Engine.
 * Request body: { name: string, category?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Item name is required for expiry estimation' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    let shelfLifeDays = getLogicalShelfLifeDays(trimmedName, category);
    let detectedCategory = category || null;

    // Connect to Google Gemini AI API to dynamically estimate shelf life for any ingredient
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
      const promptText = `You are a culinary food safety AI. Estimate standard refrigerated/pantry shelf life in days from today for: "${trimmedName}".
Output ONLY JSON object: {"shelfLifeDays": number, "category": "Vegetables & Greens" | "Fruits" | "Dairy & Plant-Milk" | "Grains & Rice" | "Legumes & Pulses" | "Spices & Seasonings" | "Condiments & Sauces" | "Nuts & Seeds" | "Other Staples"}`;

      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { response_mime_type: 'application/json', temperature: 0.1 }
              })
            }
          );

          if (geminiRes.status === 200) {
            const geminiData = await geminiRes.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (typeof parsed.shelfLifeDays === 'number' && parsed.shelfLifeDays > 0) {
                shelfLifeDays = parsed.shelfLifeDays;
              }
              if (parsed.category && typeof parsed.category === 'string') {
                detectedCategory = parsed.category;
              }
              break;
            }
          }
        } catch {
          // Continue to next model or fallback
        }
      }
    }

    const expiryDate = calculateLogicalExpiryDate(trimmedName, detectedCategory || category, shelfLifeDays);

    return NextResponse.json({
      status: 'success',
      item: trimmedName,
      category: detectedCategory || category,
      shelfLifeDays,
      expiryDate
    });
  } catch (err: unknown) {
    console.error('[API /api/pantry/estimate-expiry Error]:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to estimate expiry date' },
      { status: 500 }
    );
  }
}
