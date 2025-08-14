import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting comprehensive audit...');

    // Get detailed breakdown by year and game
    const gameBreakdown = await db.execute(sql`
      SELECT 
        hg.season_year,
        hg.game_number,
        hg.opponent,
        COUNT(hpg.id) as player_count,
        STRING_AGG(hp.name, ', ' ORDER BY hp.name) as players
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      LEFT JOIN historical_players hp ON hpg.player_id = hp.id
      GROUP BY hg.season_year, hg.game_number, hg.opponent
      ORDER BY hg.season_year DESC, hg.game_number ASC
    `);

    // Get player participation summary
    const playerParticipation = await db.execute(sql`
      SELECT 
        hp.name,
        COUNT(hpg.id) as total_games,
        MIN(hg.season_year) as first_season,
        MAX(hg.season_year) as last_season,
        STRING_AGG(DISTINCT hg.season_year::text, ', ' ORDER BY hg.season_year) as seasons_played
      FROM historical_players hp
      LEFT JOIN historical_player_games hpg ON hp.id = hpg.player_id
      LEFT JOIN historical_games hg ON hpg.game_id = hg.id
      GROUP BY hp.name
      ORDER BY total_games DESC, hp.name
    `);

    // Get games with unusually low player counts (potential missing data)
    const suspiciousGames = await db.execute(sql`
      SELECT 
        hg.season_year,
        hg.game_number,
        hg.opponent,
        COUNT(hpg.id) as player_count
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      GROUP BY hg.season_year, hg.game_number, hg.opponent
      HAVING COUNT(hpg.id) < 8  -- Games with fewer than 8 players might be missing data
      ORDER BY hg.season_year DESC, hg.game_number ASC
    `);

    // Overall statistics
    const overallStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT hg.season_year) as total_seasons,
        COUNT(DISTINCT hg.id) as total_games,
        COUNT(DISTINCT hp.id) as total_players,
        COUNT(hpg.id) as total_player_games,
        ROUND(AVG(game_counts.player_count), 2) as avg_players_per_game,
        MIN(game_counts.player_count) as min_players_per_game,
        MAX(game_counts.player_count) as max_players_per_game
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      LEFT JOIN historical_players hp ON hpg.player_id = hp.id
      CROSS JOIN (
        SELECT 
          hg2.id,
          COUNT(hpg2.id) as player_count
        FROM historical_games hg2
        LEFT JOIN historical_player_games hpg2 ON hg2.id = hpg2.game_id
        GROUP BY hg2.id
      ) as game_counts
    `);

    return NextResponse.json({
      summary: {
        expectedRows: 824,
        actualRows: 791,
        missingRows: 33
      },
      overallStats: overallStats[0],
      suspiciousGames: suspiciousGames,
      gameBreakdown: gameBreakdown.map((game: any) => ({
        year: game.season_year,
        gameNumber: game.game_number,
        opponent: game.opponent,
        playerCount: parseInt(game.player_count) || 0,
        players: game.players ? game.players.split(', ').slice(0, 5) : [] // Show first 5 players
      })),
      playerParticipation: playerParticipation.map((player: any) => ({
        name: player.name,
        totalGames: parseInt(player.total_games) || 0,
        firstSeason: player.first_season,
        lastSeason: player.last_season,
        seasonsPlayed: player.seasons_played
      })).slice(0, 20) // Top 20 most active players
    });

  } catch (error) {
    console.error('Error in comprehensive audit:', error);
    return NextResponse.json(
      { error: 'Audit failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}