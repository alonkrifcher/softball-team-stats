import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db, games, seasons } from '@/lib/db';
import { getAuthUser, hasRequiredRole, createAuthError } from '@/lib/auth/simple';

const createGameSchema = z.object({
  seasonId: z.number().int(),
  gameDate: z.string().datetime(),
  opponent: z.string().min(1),
  homeAway: z.enum(['home', 'away']),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateGameSchema = z.object({
  gameDate: z.string().datetime().optional(),
  opponent: z.string().min(1).optional(),
  homeAway: z.enum(['home', 'away']).optional(),
  location: z.string().optional(),
  ourScore: z.number().int().min(0).optional(),
  theirScore: z.number().int().min(0).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).optional(),
  notes: z.string().optional(),
});

// GET /api/games - Get all games
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const status = searchParams.get('status');

    let whereClause = undefined;
    if (seasonId) {
      whereClause = eq(games.seasonId, parseInt(seasonId));
    }
    if (status) {
      const statusClause = eq(games.status, status as any);
      whereClause = whereClause 
        ? and(whereClause, statusClause)
        : statusClause;
    }

    const allGames = await db.query.games.findMany({
      where: whereClause,
      orderBy: [desc(games.gameDate)],
      with: {
        season: true,
        playerStats: {
          with: {
            player: true,
          },
        },
      },
    });

    return NextResponse.json({ games: allGames });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/games - Create new game
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
    const { seasonId, gameDate, opponent, homeAway, location, notes } = createGameSchema.parse(body);

    // Verify season exists
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, seasonId),
    });

    if (!season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    const [newGame] = await db.insert(games).values({
      seasonId,
      gameDate: new Date(gameDate),
      opponent,
      homeAway,
      location,
      notes,
      status: 'scheduled',
    }).returning();

    // Get the game with season info
    const gameWithSeason = await db.query.games.findFirst({
      where: eq(games.id, newGame.id),
      with: {
        season: true,
      },
    });

    return NextResponse.json({ game: gameWithSeason }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}