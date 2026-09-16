import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ status: 'unauthenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { selectedPreferences: true, customPreferences: true }
    });

    if (!user) {
      return NextResponse.json({
        status: 'success',
        preferences: { selectedPreferences: [], customPreferences: '' }
      });
    }

    return NextResponse.json({
      status: 'success',
      preferences: {
        selectedPreferences: user.selectedPreferences || [],
        customPreferences: user.customPreferences || ''
      }
    });

  } catch (error: any) {
    console.error('[API GET /preferences]', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ status: 'unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { selectedPreferences = [], customPreferences = '' } = body;

    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {
        selectedPreferences,
        customPreferences
      },
      create: {
        clerkUserId: userId,
        selectedPreferences,
        customPreferences
      }
    });

    return NextResponse.json({
      status: 'success',
      preferences: {
        selectedPreferences: user.selectedPreferences,
        customPreferences: user.customPreferences
      }
    });

  } catch (error: any) {
    console.error('[API POST /preferences]', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
