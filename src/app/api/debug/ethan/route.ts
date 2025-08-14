import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Ethan Fedida games in 2025...');

    // Get all Ethan Fedida games in 2025
    const ethanGames = await db.execute(sql`
      SELECT 
        hg.game_number,
        hg.game_date,
        hg.opponent,
        hpg.at_bats,
        hpg.hits,
        hp.name
      FROM historical_player_games hpg
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hp.name = 'Ethan Fedida'
      AND hg.season_year = 2025
      ORDER BY hg.game_number ASC
    `);

    // Also get the count from our season stats query to see what's different
    const seasonStats = await db.execute(sql`
      SELECT 
        hp.name as player_name,
        COUNT(hpg.id) as games_played,
        SUM(hpg.at_bats) as total_at_bats
      FROM historical_players hp
      INNER JOIN historical_player_games hpg ON hp.id = hpg.player_id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hp.name = 'Ethan Fedida'
      AND hg.season_year = 2025
      GROUP BY hp.name
    `);

    return NextResponse.json({
      ethanGames: ethanGames,
      seasonStats: seasonStats,
      actualGameCount: ethanGames.length,
      seasonStatsCount: seasonStats.length > 0 ? (seasonStats[0] as any).games_played : 0
    });

  } catch (error) {
    console.error('Error checking Ethan games:', error);
    return NextResponse.json(
      { error: 'Failed to check Ethan games' },
      { status: 500 }
    );
  }
}