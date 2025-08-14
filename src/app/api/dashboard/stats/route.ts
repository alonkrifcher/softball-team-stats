import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getAuthUser, createAuthError } from '@/lib/auth/simple';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    // Get total games played (completed games)
    const gamesPlayedResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM games WHERE status = 'completed'
    `);
    const gamesPlayed = Number(gamesPlayedResult[0]?.count || 0);

    // Get team batting average (all completed games)
    const teamAvgResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(pgs.hits), 0) as total_hits,
        COALESCE(SUM(pgs.at_bats), 0) as total_at_bats
      FROM player_game_stats pgs
      JOIN games g ON pgs.game_id = g.id
      WHERE g.status = 'completed'
    `);
    const totalHits = Number(teamAvgResult[0]?.total_hits || 0);
    const totalAtBats = Number(teamAvgResult[0]?.total_at_bats || 0);
    const teamAverage = totalAtBats > 0 ? (totalHits / totalAtBats).toFixed(3) : '0.000';

    // Get active players count
    const activePlayersResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM players WHERE is_active = true
    `);
    const activePlayers = Number(activePlayersResult[0]?.count || 0);

    // Get win rate (games where our_score > their_score)
    const winRateResult = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN our_score > their_score THEN 1 END) as wins,
        COUNT(*) as total_games
      FROM games 
      WHERE status = 'completed' 
      AND our_score IS NOT NULL 
      AND their_score IS NOT NULL
    `);
    const wins = Number(winRateResult[0]?.wins || 0);
    const totalCompletedGames = Number(winRateResult[0]?.total_games || 0);
    const winRate = totalCompletedGames > 0 ? Math.round((wins / totalCompletedGames) * 100) : 0;

    return NextResponse.json({
      gamesPlayed,
      teamAverage,
      activePlayers,
      winRate: `${winRate}%`
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}