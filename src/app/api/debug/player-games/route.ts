import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('player');
    const year = searchParams.get('year');
    
    if (!playerName || !year) {
      return NextResponse.json({ error: 'Missing player or year parameter' }, { status: 400 });
    }

    console.log(`🔍 Fetching all games for ${playerName} in ${year}...`);

    // Get all player-game records for this player and year
    const playerGames = await db.execute(sql`
      SELECT 
        hg.season_year,
        hg.game_number,
        hg.game_date,
        hg.opponent,
        hg.result,
        hp.name as player_name,
        hpg.at_bats,
        hpg.runs,
        hpg.hits,
        hpg.avg
      FROM historical_player_games hpg
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hp.name = ${playerName} 
      AND hg.season_year = ${parseInt(year)}
      ORDER BY hg.game_number ASC
    `);

    console.log(`📊 Found ${playerGames.length} games for ${playerName} in ${year}`);

    return NextResponse.json({
      player: playerName,
      year: parseInt(year),
      totalGames: playerGames.length,
      games: playerGames.map((game: any) => ({
        gameNumber: game.game_number,
        gameDate: game.game_date,
        opponent: game.opponent,
        result: game.result,
        atBats: game.at_bats,
        runs: game.runs,
        hits: game.hits,
        avg: parseFloat(game.avg) || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching player games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player games' },
      { status: 500 }
    );
  }
}