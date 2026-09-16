import { NextRequest, NextResponse } from 'next/server';
import { IngredientItem } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images = body.images || [];

    if (!images || images.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No images provided for extraction.'
      }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY is missing from environment variables.'
      }, { status: 500 });
    }

    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    const promptText = `You are an expert food computer vision AI assistant for a zero-waste cooking app.
Analyze the provided kitchen, refrigerator, pantry, or countertop images. Identify ALL visible food ingredients, produce, dairy, fruits, vegetables, spices, pulses, grains, or staples.

Output ONLY a JSON array of objects with the following structure:
[
  {
    "name": "Ingredient Name",
    "quantity": 1,
    "unit": "pcs",
    "category": "Vegetables & Greens"
  }
]

Allowed categories: "Vegetables & Greens", "Fruits", "Dairy & Plant-Milk", "Grains & Rice", "Legumes & Pulses", "Spices & Seasonings", "Condiments & Sauces", "Nuts & Seeds", "Other Staples".
Allowed units: "pcs", "g", "kg", "ml", "l", "cup", "tbsp", "tsp", "bunch", "slice", "block".
Ensure ingredients are 100% vegetarian. If no food items are detected, return [].`;

    for (const model of candidateModels) {
      try {
        const payloadParts = [
          { text: promptText },
          ...images.map((img: { base64Data: string; mimeType?: string }) => {
            const match = img.base64Data.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,/);
            const mimeType = match ? match[1] : (img.mimeType || 'image/jpeg');
            const cleanBase64 = img.base64Data.replace(/^data:.*?;base64,/, '').trim();
            return {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64
              }
            };
          })
        ];

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: payloadParts }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2
            }
          })
        });

        if (geminiRes.status === 200) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (responseText) {
            let parsedRaw: unknown = null;
            try {
              parsedRaw = JSON.parse(responseText);
            } catch {
              const jsonMatch = responseText.match(/\[[\s\S]*\]/);
              if (jsonMatch) parsedRaw = JSON.parse(jsonMatch[0]);
            }

            let parsedList: Array<{ name?: string; quantity?: number; unit?: import('@/types').MetricUnit; category?: import('@/types').IngredientCategory }> = [];
            if (Array.isArray(parsedRaw)) {
              parsedList = parsedRaw;
            } else if (parsedRaw && typeof parsedRaw === 'object') {
              const rawObj = parsedRaw as Record<string, unknown>;
              const possibleArray = rawObj.ingredients || rawObj.items || rawObj.detectedIngredients || rawObj.data || rawObj.food;
              if (Array.isArray(possibleArray)) {
                parsedList = possibleArray;
              }
            }

            if (parsedList.length > 0) {
              const detectedIngredients: IngredientItem[] = parsedList.map((item, idx: number) => ({
                id: 'ing_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now() + '_' + idx,
                name: item.name && typeof item.name === 'string' ? item.name.trim() : 'Fresh Produce Item',
                quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
                unit: item.unit || 'pcs',
                category: item.category || 'Vegetables & Greens',
                isAutoCorrected: false,
                confidenceScore: 0.95,
                source: 'camera_vision'
              }));

              return NextResponse.json({
                status: 'success',
                processedImagesCount: images.length,
                detectedIngredients
              });
            }
          }
        } else {
          const errData = await geminiRes.json();
          console.warn(`[Gemini Vision] Model ${model} status ${geminiRes.status}:`, errData?.error?.message || errData);
        }
      } catch (geminiErr) {
        console.warn(`[Gemini Vision] Error calling ${model}:`, geminiErr);
      }
    }

    return NextResponse.json({
      status: 'error',
      message: 'No clear food ingredients detected in image. Please try taking a clearer, well-lit photo of your food items.'
    }, { status: 422 });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Vision extraction failed';
    return NextResponse.json({
      status: 'error',
      message: errorMessage
    }, { status: 500 });
  }
}
