import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDbUser } from '@/lib/userHelper';
import { RecipeItem } from '@/types';
import crypto from 'crypto';

let tableEnsured = false;
async function ensureSavedRecipeTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SavedRecipe" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "recipeId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "prepTimeMinutes" INTEGER NOT NULL,
        "recipeTier" TEXT NOT NULL,
        "ingredientMatchPercentage" DOUBLE PRECISION DEFAULT 100,
        "usedIngredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "pantryStaplesNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "nutrientBoostItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "chefTip" TEXT,
        "nutrientTip" TEXT,
        "ayurvedicPurityTag" TEXT,
        "nutritionInfo" JSONB,
        "ecoImpact" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "SavedRecipe_userId_idx" ON "SavedRecipe"("userId");
    `);
    tableEnsured = true;
  } catch (e) {
    console.warn('[SavedRecipes] Table verification warning:', e);
  }
}

function mapRecordToRecipe(r: any): RecipeItem {
  return {
    recipeId: r.recipeId,
    title: r.title,
    prepTimeMinutes: r.prepTimeMinutes,
    recipeTier: (r.recipeTier || 'fridge_staple') as 'fridge_staple' | 'nutrient_boost',
    ingredientMatchPercentage: r.ingredientMatchPercentage ?? 100,
    usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients : [],
    pantryStaplesNeeded: Array.isArray(r.pantryStaplesNeeded) ? r.pantryStaplesNeeded : [],
    nutrientBoostItems: Array.isArray(r.nutrientBoostItems) ? r.nutrientBoostItems : [],
    instructions: Array.isArray(r.instructions) ? r.instructions : [],
    chefTip: r.chefTip ?? undefined,
    nutrientTip: r.nutrientTip ?? undefined,
    ayurvedicPurityTag: r.ayurvedicPurityTag ?? undefined,
    nutritionInfo: r.nutritionInfo ?? undefined,
    ecoImpact: r.ecoImpact ?? undefined,
    savedRecipeDbId: r.id
  };
}

// GET — fetch all saved recipes for current user
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to view saved recipes.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);
    await ensureSavedRecipeTable();

    let savedRecords: any[] = [];

    // Try Prisma model if client has it, otherwise use raw query
    if (typeof (prisma as any).savedRecipe?.findMany === 'function') {
      try {
        savedRecords = await (prisma as any).savedRecipe.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'desc' }
        });
      } catch {
        savedRecords = await prisma.$queryRaw`
          SELECT * FROM "SavedRecipe" WHERE "userId" = ${dbUser.id} ORDER BY "createdAt" DESC
        `;
      }
    } else {
      savedRecords = await prisma.$queryRaw`
        SELECT * FROM "SavedRecipe" WHERE "userId" = ${dbUser.id} ORDER BY "createdAt" DESC
      `;
    }

    const recipes: RecipeItem[] = (savedRecords || []).map(mapRecordToRecipe);
    return NextResponse.json({ status: 'success', recipes });
  } catch (err: any) {
    console.error('[SavedRecipes GET] Error:', err);
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Failed to fetch saved recipes' },
      { status: 500 }
    );
  }
}

// POST — save a recipe to DB
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Please sign in to save recipes to your account.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);
    await ensureSavedRecipeTable();

    const recipe: RecipeItem = await req.json();
    if (!recipe || !recipe.recipeId || !recipe.title) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid recipe payload.' },
        { status: 400 }
      );
    }

    const newId = 'sr_' + crypto.randomBytes(8).toString('hex');
    const nutritionInfoJson = recipe.nutritionInfo ? JSON.stringify(recipe.nutritionInfo) : null;
    const ecoImpactJson = recipe.ecoImpact ? JSON.stringify(recipe.ecoImpact) : null;

    let savedDbId = newId;

    // Check if recipe already saved for this user
    const existing: any[] = await prisma.$queryRaw`
      SELECT id FROM "SavedRecipe" WHERE "userId" = ${dbUser.id} AND "recipeId" = ${recipe.recipeId} LIMIT 1
    `;

    if (existing && existing.length > 0) {
      savedDbId = existing[0].id;
    } else {
      // Insert via raw SQL to ensure all fields are saved safely
      await prisma.$executeRaw`
        INSERT INTO "SavedRecipe" (
          "id", "userId", "recipeId", "title", "prepTimeMinutes", "recipeTier",
          "ingredientMatchPercentage", "usedIngredients", "pantryStaplesNeeded",
          "nutrientBoostItems", "instructions", "chefTip", "nutrientTip",
          "ayurvedicPurityTag", "nutritionInfo", "ecoImpact", "createdAt"
        ) VALUES (
          ${newId},
          ${dbUser.id},
          ${recipe.recipeId},
          ${recipe.title},
          ${recipe.prepTimeMinutes || 15},
          ${recipe.recipeTier || 'fridge_staple'},
          ${recipe.ingredientMatchPercentage ?? 100},
          ${recipe.usedIngredients ?? []},
          ${recipe.pantryStaplesNeeded ?? []},
          ${recipe.nutrientBoostItems ?? []},
          ${recipe.instructions ?? []},
          ${recipe.chefTip ?? null},
          ${recipe.nutrientTip ?? null},
          ${recipe.ayurvedicPurityTag ?? null},
          ${nutritionInfoJson}::jsonb,
          ${ecoImpactJson}::jsonb,
          NOW()
        )
      `;
    }

    const returnRecipe: RecipeItem = {
      ...recipe,
      savedRecipeDbId: savedDbId
    };

    return NextResponse.json({ status: 'success', recipe: returnRecipe });
  } catch (err: any) {
    console.error('[SavedRecipes POST] Error:', err);
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Failed to save recipe to database' },
      { status: 500 }
    );
  }
}

// DELETE — unsave a recipe by DB id or recipeId
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to delete saved recipes.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);
    await ensureSavedRecipeTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing recipe id' }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM "SavedRecipe"
      WHERE "userId" = ${dbUser.id}
        AND ("id" = ${id} OR "recipeId" = ${id})
    `;

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('[SavedRecipes DELETE] Error:', err);
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
