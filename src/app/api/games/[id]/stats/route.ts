import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, playerGameStats, games, players } from '@/lib/db';
import { withRole } from '@/lib/auth/middleware';

const playerStatSchema = z.object({
  playerId: z.number().int(),
  battingOrder: z.number().int().min(1).max(15).optional(),
  atBats: z.number().int().min(0).default(0),
  hits: z.number().int().min(0).default(0),
  runs: z.number().int().min(0).default(0),
  rbis: z.number().int().min(0).default(0),
  walks: z.number().int().min(0).default(0),
  strikeouts: z.number().int().min(0).default(0),
  singles: z.number().int().min(0).default(0),
  doubles: z.number().int().min(0).default(0),
  triples: z.number().int().min(0).default(0),
  homeRuns: z.number().int().min(0).default(0),
  stolenBases: z.number().int().min(0).default(0),
  fieldingPosition: z.string().optional(),
  errors: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  putouts: z.number().int().min(0).default(0),
});

const bulkStatsSchema = z.object({
  playerStats: z.array(playerStatSchema),
  gameScore: z.object({
    ourScore: z.number().int().min(0).optional(),
    theirScore: z.number().int().min(0).optional(),
  }).optional(),
});

// GET /api/games/[id]/stats - Get all stats for a game
export const GET = withRole('player', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const gameId = parseInt(params.id);
    
    const gameStats = await db.query.playerGameStats.findMany({
      where: eq(playerGameStats.gameId, gameId),
      with: {
        player: true,
      },
      orderBy: (playerGameStats, { asc }) => [asc(playerGameStats.battingOrder)],
    });

    return NextResponse.json({ stats: gameStats });
  } catch (error) {
    console.error('Get game stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/games/[id]/stats - Add/update stats for multiple players in a game
export const POST = withRole('manager', async (
  request: NextRequest,
  payload: any,
  { params }: { params: { id: string } }
) => {
  try {
    const gameId = parseInt(params.id);
    const body = await request.json();
    const { playerStats: statsData, gameScore } = bulkStatsSchema.parse(body);

    // Verify game exists
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Verify all players exist
    for (const stat of statsData) {
      const player = await db.query.players.findFirst({
        where: eq(players.id, stat.playerId),
      });

      if (!player) {
        return NextResponse.json(
          { error: `Player with ID ${stat.playerId} not found` },
          { status: 404 }
        );
      }
    }

    // Delete existing stats for this game (we'll replace them)
    await db.delete(playerGameStats).where(eq(playerGameStats.gameId, gameId));

    // Insert new stats
    const insertedStats = [];
    for (const stat of statsData) {
      const [insertedStat] = await db.insert(playerGameStats).values({
        gameId,
        playerId: stat.playerId,
        battingOrder: stat.battingOrder,
        atBats: stat.atBats,
        hits: stat.hits,
        runs: stat.runs,
        rbis: stat.rbis,
        walks: stat.walks,
        strikeouts: stat.strikeouts,
        singles: stat.singles,
        doubles: stat.doubles,
        triples: stat.triples,
        homeRuns: stat.homeRuns,
        stolenBases: stat.stolenBases,
        fieldingPosition: stat.fieldingPosition,
        errors: stat.errors,
        assists: stat.assists,
        putouts: stat.putouts,
      }).returning();

      insertedStats.push(insertedStat);
    }

    // Update game score and status if provided
    if (gameScore) {
      await db.update(games)
        .set({
          ourScore: gameScore.ourScore,
          theirScore: gameScore.theirScore,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId));
    }

    // Get the stats with player info
    const statsWithPlayers = await db.query.playerGameStats.findMany({
      where: eq(playerGameStats.gameId, gameId),
      with: {
        player: true,
      },
      orderBy: (playerGameStats, { asc }) => [asc(playerGameStats.battingOrder)],
    });

    return NextResponse.json({ 
      stats: statsWithPlayers,
      message: 'Stats saved successfully'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Save game stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});