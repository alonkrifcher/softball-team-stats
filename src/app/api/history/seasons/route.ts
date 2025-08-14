import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const seasons = await db.execute(sql`
      SELECT 
        hs.year,
        COUNT(DISTINCT hg.id) as game_count,
        COALESCE(AVG(hpg.avg), 0) as team_avg,
        COUNT(DISTINCT hp.id) as player_count,
        SUM(CASE WHEN hg.result LIKE 'W%' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN hg.result LIKE 'L%' THEN 1 ELSE 0 END) as losses
      FROM historical_seasons hs
      LEFT JOIN historical_games hg ON hs.year = hg.season_year
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      LEFT JOIN historical_players hp ON hpg.player_id = hp.id
      GROUP BY hs.year
      ORDER BY hs.year DESC
    `);

    const result = seasons.map(season => {
      const s = season as any;
      const wins = parseInt(s.wins) || 0;
      const losses = parseInt(s.losses) || 0;
      const winLossRecord = wins > 0 || losses > 0 ? `${wins}-${losses}` : 'Unknown';

      return {
        year: s.year,
        gameCount: parseInt(s.game_count) || 0,
        winLossRecord,
        teamAvg: parseFloat(s.team_avg) || 0,
        playerCount: parseInt(s.player_count) || 0,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}