import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking all players in Game 2 (2025)...');

    // Get all players in Game 2 of 2025
    const game2Players = await db.execute(sql`
      SELECT 
        hp.name,
        hpg.at_bats,
        hpg.hits,
        hg.game_number,
        hg.game_date,
        hg.opponent
      FROM historical_player_games hpg
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hg.season_year = 2025 
      AND hg.game_number = 2
      ORDER BY hp.name ASC
    `);

    // Also check if there are any records with names similar to "Ethan Fedida"
    const similarNames = await db.execute(sql`
      SELECT DISTINCT hp.name
      FROM historical_players hp
      WHERE hp.name ILIKE '%ethan%' 
      OR hp.name ILIKE '%fedida%'
      ORDER BY hp.name
    `);

    // Check all Ethan records across all years/games
    const allEthanRecords = await db.execute(sql`
      SELECT 
        hg.season_year,
        hg.game_number,
        hp.name,
        hpg.at_bats,
        hpg.hits
      FROM historical_player_games hpg
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hp.name ILIKE '%ethan%fedida%'
      ORDER BY hg.season_year, hg.game_number
    `);

    return NextResponse.json({
      game2Players: game2Players,
      game2PlayerCount: game2Players.length,
      similarNames: similarNames,
      allEthanRecords: allEthanRecords,
      ethanInGame2: game2Players.filter((p: any) => p.name.toLowerCase().includes('ethan'))
    });

  } catch (error) {
    console.error('Error checking Game 2:', error);
    return NextResponse.json(
      { error: 'Failed to check Game 2' },
      { status: 500 }
    );
  }
}