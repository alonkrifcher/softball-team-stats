import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, games } from '@/lib/db';
import { authenticate, checkRole } from '@/lib/auth/middleware';

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

// GET /api/games/[id] - Get specific game
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);
    
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
      with: {
        season: true,
        playerStats: {
          with: {
            player: true,
          },
          orderBy: (playerGameStats, { asc }) => [asc(playerGameStats.battingOrder)],
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/games/[id] - Update game
export const PUT = withRole('manager', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const gameId = parseInt(params.id);
    const body = await request.json();
    const updateData = updateGameSchema.parse(body);

    // Convert date string to Date object if provided
    const processedUpdateData = {
      ...updateData,
      ...(updateData.gameDate && { gameDate: new Date(updateData.gameDate) }),
      updatedAt: new Date(),
    };

    const [updatedGame] = await db.update(games)
      .set(processedUpdateData)
      .where(eq(games.id, gameId))
      .returning();

    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Get the updated game with season info
    const gameWithSeason = await db.query.games.findFirst({
      where: eq(games.id, gameId),
      with: {
        season: true,
        playerStats: {
          with: {
            player: true,
          },
          orderBy: (playerGameStats, { asc }) => [asc(playerGameStats.battingOrder)],
        },
      },
    });

    return NextResponse.json({ game: gameWithSeason });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/games/[id] - Delete game
export const DELETE = withRole('manager', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const gameId = parseInt(params.id);
    
    const [deletedGame] = await db.delete(games)
      .where(eq(games.id, gameId))
      .returning();

    if (!deletedGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});