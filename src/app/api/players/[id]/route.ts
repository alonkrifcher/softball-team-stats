import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, players } from '@/lib/db';
import { withRole } from '@/lib/auth/middleware';

const updatePlayerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  primaryPosition: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/players/[id] - Get specific player
export const GET = withRole('player', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const playerId = parseInt(params.id);
    
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
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

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/players/[id] - Update player
export const PUT = withRole('manager', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const playerId = parseInt(params.id);
    const body = await request.json();
    const updateData = updatePlayerSchema.parse(body);

    // Check if jersey number is already taken by another player
    if (updateData.jerseyNumber) {
      const existingPlayer = await db.query.players.findFirst({
        where: eq(players.jerseyNumber, updateData.jerseyNumber),
      });

      if (existingPlayer && existingPlayer.id !== playerId) {
        return NextResponse.json(
          { error: 'Jersey number already taken' },
          { status: 400 }
        );
      }
    }

    const [updatedPlayer] = await db.update(players)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(players.id, playerId))
      .returning();

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get the updated player with user info
    const playerWithUser = await db.query.players.findFirst({
      where: eq(players.id, playerId),
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

    return NextResponse.json({ player: playerWithUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});