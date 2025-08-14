import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    console.log('📅 Fetching historical schedule...');

    let whereClause = '';
    let params: any[] = [];
    
    if (year) {
      whereClause = 'WHERE hg.season_year = $1';
      params = [parseInt(year)];
    }

    // Get all games with results
    const games = await db.execute(sql.raw(`
      SELECT 
        hg.id,
        hg.season_year,
        hg.game_number,
        hg.game_date,
        hg.opponent,
        hg.result,
        hg.uhj_runs,
        hg.opp_runs,
        COUNT(hpg.id) as player_count
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      ${whereClause}
      GROUP BY hg.id, hg.season_year, hg.game_number, hg.game_date, hg.opponent, hg.result, hg.uhj_runs, hg.opp_runs
      ORDER BY hg.season_year DESC, hg.game_date ASC, hg.game_number ASC
    `, params));

    // Get available seasons
    const seasons = await db.execute(sql`
      SELECT DISTINCT season_year as year
      FROM historical_games
      ORDER BY season_year DESC
    `);

    console.log(`📊 Found ${games.length} games across ${seasons.length} seasons`);

    const processedGames = games.map(game => {
      const g = game as any;
      
      return {
        id: g.id,
        seasonYear: g.season_year,
        gameNumber: g.game_number,
        gameDate: g.game_date,
        opponent: g.opponent || 'TBD',
        result: g.result || null,
        uhjRuns: g.uhj_runs,
        oppRuns: g.opp_runs,
        playerCount: parseInt(g.player_count) || 0,
        status: g.result ? 'completed' : 'scheduled'
      };
    });

    // Group games by season for easier display
    const gamesBySeason = processedGames.reduce((acc: any, game) => {
      if (!acc[game.seasonYear]) {
        acc[game.seasonYear] = [];
      }
      acc[game.seasonYear].push(game);
      return acc;
    }, {});

    return NextResponse.json({
      games: processedGames,
      gamesBySeason: gamesBySeason,
      availableSeasons: seasons.map((s: any) => s.year),
      totalGames: games.length
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}