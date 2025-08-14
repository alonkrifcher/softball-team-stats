import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    const year = parseInt(params.year);
    
    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching games for year ${year}...`);

    const games = await db.execute(sql`
      SELECT 
        hg.id,
        hg.game_number,
        hg.game_date,
        hg.opponent,
        hg.result,
        hg.uhj_runs,
        hg.opp_runs,
        COUNT(hpg.id) as player_count
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      WHERE hg.season_year = ${year}
      GROUP BY hg.id, hg.game_number, hg.game_date, hg.opponent, hg.result, hg.uhj_runs, hg.opp_runs
      ORDER BY hg.game_number ASC
    `);

    console.log(`📊 Found ${games.length} games for ${year}`);

    const result = games.map(game => {
      const g = game as any;
      
      return {
        id: g.id,
        gameNumber: g.game_number,
        gameDate: g.game_date,
        opponent: g.opponent || 'Unknown Opponent',
        result: g.result || '',
        uhjRuns: g.uhj_runs,
        oppRuns: g.opp_runs,
        playerCount: parseInt(g.player_count) || 0,
      };
    });

    console.log('✅ Processed games result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error(`Error fetching games for year ${params.year}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}