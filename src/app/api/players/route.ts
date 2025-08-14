import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, asc } from 'drizzle-orm';
import { db, players, users } from '@/lib/db';
import { withRole } from '@/lib/auth/middleware';

const createPlayerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  primaryPosition: z.string().optional(),
  userId: z.number().int().optional(),
});

// GET /api/players - Get all active players
export const GET = withRole('player', async (request: NextRequest) => {
  try {
    const allPlayers = await db.query.players.findMany({
      where: eq(players.isActive, true),
      orderBy: [asc(players.lastName), asc(players.firstName)],
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ players: allPlayers });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/players - Create new player
export const POST = withRole('manager', async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { firstName, lastName, jerseyNumber, primaryPosition, userId } = createPlayerSchema.parse(body);

    // Check if jersey number is already taken
    if (jerseyNumber) {
      const existingPlayer = await db.query.players.findFirst({
        where: eq(players.jerseyNumber, jerseyNumber),
      });

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'Jersey number already taken' },
          { status: 400 }
        );
      }
    }

    const [newPlayer] = await db.insert(players).values({
      firstName,
      lastName,
      jerseyNumber,
      primaryPosition,
      userId,
    }).returning();

    // Get the player with user info
    const playerWithUser = await db.query.players.findFirst({
      where: eq(players.id, newPlayer.id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ player: playerWithUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});