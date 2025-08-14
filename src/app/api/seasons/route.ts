import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db, seasons } from '@/lib/db';
import { getAuthUser, hasRequiredRole, createAuthError } from '@/lib/auth/simple';

const createSeasonSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// GET /api/seasons - Get all seasons
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    const allSeasons = await db.query.seasons.findMany({
      orderBy: [desc(seasons.year), desc(seasons.startDate)],
    });

    return NextResponse.json({ seasons: allSeasons });
  } catch (error) {
    console.error('Get seasons error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/seasons - Create new season
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    if (!hasRequiredRole(user.role, 'manager')) {
      return createAuthError('Insufficient permissions', 403);
    }

    const body = await request.json();
    const { name, year, startDate, endDate } = createSeasonSchema.parse(body);

    // Deactivate other seasons if this is being set as active
    await db.update(seasons)
      .set({ isActive: false })
      .where(eq(seasons.isActive, true));

    const [newSeason] = await db.insert(seasons).values({
      name,
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    }).returning();

    return NextResponse.json({ season: newSeason }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create season error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}