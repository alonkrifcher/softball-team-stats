import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🏆 Fetching comprehensive player roster...');
    
    // Get all players with their career stats from historical data
    const playersData = await db.execute(sql`
      SELECT 
        p.player_name,
        COUNT(DISTINCT pgs.game_id) as total_games,
        COUNT(DISTINCT s.year) as seasons_played,
        MIN(s.year) as first_season,
        MAX(s.year) as last_season,
        STRING_AGG(DISTINCT CAST(s.year AS VARCHAR), ', ' ORDER BY CAST(s.year AS VARCHAR)) as seasons_list,
        
        -- Batting stats
        COALESCE(SUM(pgs.at_bats), 0) as total_at_bats,
        COALESCE(SUM(pgs.hits), 0) as total_hits,
        COALESCE(SUM(pgs.runs), 0) as total_runs,
        COALESCE(SUM(pgs.rbis), 0) as total_rbis,
        COALESCE(SUM(pgs.walks), 0) as total_walks,
        COALESCE(SUM(pgs.strikeouts), 0) as total_strikeouts,
        COALESCE(SUM(pgs.doubles), 0) as total_doubles,
        COALESCE(SUM(pgs.triples), 0) as total_triples,
        COALESCE(SUM(pgs.home_runs), 0) as total_home_runs,
        COALESCE(SUM(pgs.stolen_bases), 0) as total_stolen_bases,
        
        -- Calculated averages
        CASE 
          WHEN SUM(pgs.at_bats) > 0 
          THEN ROUND(CAST(SUM(pgs.hits) AS DECIMAL) / SUM(pgs.at_bats), 3)
          ELSE 0.000
        END as batting_average,
        
        CASE 
          WHEN (SUM(pgs.at_bats) + SUM(pgs.walks)) > 0 
          THEN ROUND(CAST(SUM(pgs.hits) + SUM(pgs.walks) AS DECIMAL) / (SUM(pgs.at_bats) + SUM(pgs.walks)), 3)
          ELSE 0.000
        END as on_base_percentage,
        
        -- Most recent season info
        (SELECT STRING_AGG(DISTINCT position, ', ') 
         FROM historical_player_game_stats hpgs 
         WHERE hpgs.player_name = p.player_name 
         AND hpgs.position IS NOT NULL 
         AND hpgs.position != ''
        ) as positions_played
        
      FROM historical_players p
      LEFT JOIN historical_player_game_stats pgs ON p.player_name = pgs.player_name
      LEFT JOIN historical_games g ON pgs.game_id = g.game_id
      LEFT JOIN historical_seasons s ON g.season_id = s.season_id
      GROUP BY p.player_name
      ORDER BY total_games DESC, p.player_name ASC
    `);

    const players = playersData.map(row => ({
      name: row.player_name,
      totalGames: Number(row.total_games) || 0,
      seasonsPlayed: Number(row.seasons_played) || 0,
      firstSeason: row.first_season,
      lastSeason: row.last_season,
      seasonsList: row.seasons_list || '',
      positionsPlayed: row.positions_played || 'Unknown',
      
      // Career batting stats
      stats: {
        atBats: Number(row.total_at_bats) || 0,
        hits: Number(row.total_hits) || 0,
        runs: Number(row.total_runs) || 0,
        rbis: Number(row.total_rbis) || 0,
        walks: Number(row.total_walks) || 0,
        strikeouts: Number(row.total_strikeouts) || 0,
        doubles: Number(row.total_doubles) || 0,
        triples: Number(row.total_triples) || 0,
        homeRuns: Number(row.total_home_runs) || 0,
        stolenBases: Number(row.total_stolen_bases) || 0,
        battingAverage: Number(row.batting_average) || 0,
        onBasePercentage: Number(row.on_base_percentage) || 0,
      }
    }));

    console.log(`✅ Found ${players.length} players in roster`);
    
    return NextResponse.json({
      success: true,
      players: players,
      totalPlayers: players.length
    });

  } catch (error) {
    console.error('❌ Roster fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch roster', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}