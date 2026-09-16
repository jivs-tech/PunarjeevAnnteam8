import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDbUser } from '@/lib/userHelper';
import { calculateLogicalExpiryDate } from '@/lib/pantryExpiryHelper';

/**
 * Calculates deterministic expiry metrics for a list of pantry items based on current UTC/local date.
 */
function calculateExpiryMetrics(items: Array<{ expiryDate?: string | null }>) {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  let expiredCount = 0;
  let expiringTodayCount = 0;
  let expiringSoonCount = 0;
  let freshCount = 0;

  for (const item of items) {
    if (!item.expiryDate) {
      freshCount++;
      continue;
    }

    const expDate = new Date(item.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expiredCount++;
    } else if (diffDays === 0) {
      expiringTodayCount++;
    } else if (diffDays <= 3) {
      expiringSoonCount++;
    } else {
      freshCount++;
    }
  }

  return {
    total: items.length,
    expiredCount,
    expiringTodayCount,
    expiringSoonCount,
    freshCount
  };
}

/**
 * GET /api/pantry
 * Protected endpoint to fetch the authenticated user's pantry items from Neon Postgres.
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to access private pantry data.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);

    const dbItems = await prisma.pantryItem.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' }
    });

    const items = dbItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiryDate: item.expiryDate || undefined,
      addedAt: item.createdAt.getTime(),
      source: 'manual' as const
    }));

    const metrics = calculateExpiryMetrics(items);

    return NextResponse.json({
      status: 'success',
      items,
      metrics
    });
  } catch (err: unknown) {
    console.error('[API /api/pantry GET Error]:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch pantry items from database' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pantry
 * Protected endpoint to create a new pantry item in Neon Postgres for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to save pantry items.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);

    const body = await req.json();
    const { name, quantity, unit, category, expiryDate } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Valid item name is required' },
        { status: 400 }
      );
    }

    const finalExpiryDate = expiryDate || calculateLogicalExpiryDate(name, category);

    const newItem = await prisma.pantryItem.create({
      data: {
        userId: dbUser.id,
        name: name.trim(),
        quantity: typeof quantity === 'number' && quantity > 0 ? quantity : 1,
        unit: unit || 'pcs',
        category: category || 'Other Staples',
        expiryDate: finalExpiryDate
      }
    });

    return NextResponse.json({
      status: 'success',
      item: {
        id: newItem.id,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        category: newItem.category,
        expiryDate: newItem.expiryDate || undefined,
        addedAt: newItem.createdAt.getTime(),
        source: 'manual' as const
      }
    });
  } catch (err: unknown) {
    console.error('[API /api/pantry POST Error]:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save pantry item to database' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pantry
 * Protected endpoint to update an existing pantry item owned by the authenticated user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to edit pantry items.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);

    const body = await req.json();
    const { id, name, quantity, unit, category, expiryDate } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { status: 'error', message: 'Pantry item ID is required for updates' },
        { status: 400 }
      );
    }

    // Ensure item belongs to authenticated user
    const updated = await prisma.pantryItem.updateMany({
      where: {
        id,
        userId: dbUser.id
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof quantity === 'number' && { quantity }),
        ...(unit && { unit }),
        ...(category && { category }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate || null })
      }
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Item not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Pantry item updated successfully'
    });
  } catch (err: unknown) {
    console.error('[API /api/pantry PATCH Error]:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update pantry item in database' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pantry
 * Protected endpoint to delete a pantry item owned by the authenticated user (or clear all).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { status: 'unauthenticated', message: 'Sign in required to delete pantry items.' },
        { status: 401 }
      );
    }

    const dbUser = await getOrCreateDbUser(clerkUserId);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Delete specific item owned by user
      const deleted = await prisma.pantryItem.deleteMany({
        where: {
          id,
          userId: dbUser.id
        }
      });

      if (deleted.count === 0) {
        return NextResponse.json(
          { status: 'error', message: 'Item not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Clear all items owned by user
      await prisma.pantryItem.deleteMany({
        where: { userId: dbUser.id }
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Pantry item(s) deleted successfully'
    });
  } catch (err: unknown) {
    console.error('[API /api/pantry DELETE Error]:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete pantry item from database' },
      { status: 500 }
    );
  }
}
