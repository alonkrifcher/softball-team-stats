import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🏆 Fetching comprehensive player roster...');
    
    // Get all players with their career stats from historical data
    const playersData = await db.execute(sql`
      SELECT 
        hp.name as player_name,
        COUNT(hpg.id) as total_games,
        COUNT(DISTINCT hg.season_year) as seasons_played,
        MIN(hg.season_year) as first_season,
        MAX(hg.season_year) as last_season,
        STRING_AGG(DISTINCT CAST(hg.season_year AS VARCHAR), ', ' ORDER BY CAST(hg.season_year AS VARCHAR)) as seasons_list,
        
        -- Batting stats (using same columns as working historical APIs)
        COALESCE(SUM(hpg.at_bats), 0) as total_at_bats,
        COALESCE(SUM(hpg.hits), 0) as total_hits,
        COALESCE(SUM(hpg.runs), 0) as total_runs,
        COALESCE(SUM(hpg.rbis), 0) as total_rbis,
        COALESCE(SUM(hpg.walks), 0) as total_walks,
        COALESCE(SUM(hpg.strikeouts), 0) as total_strikeouts,
        COALESCE(SUM(hpg.singles), 0) as total_singles,
        COALESCE(SUM(hpg.doubles), 0) as total_doubles,
        COALESCE(SUM(hpg.triples), 0) as total_triples,
        COALESCE(SUM(hpg.home_runs), 0) as total_home_runs,
        
        -- Calculated averages
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.hits)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0.000
        END as batting_average,
        
        CASE 
          WHEN SUM(hpg.on_base_denominator) > 0 
          THEN ROUND(SUM(hpg.on_base_numerator)::decimal / SUM(hpg.on_base_denominator)::decimal, 3)
          ELSE 0.000
        END as on_base_percentage,
        
        -- Position info (placeholder for now)
        'Various' as positions_played
        
      FROM historical_players hp
      LEFT JOIN historical_player_games hpg ON hp.id = hpg.player_id
      LEFT JOIN historical_games hg ON hpg.game_id = hg.id
      GROUP BY hp.name
      ORDER BY total_games DESC, hp.name ASC
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
        singles: Number(row.total_singles) || 0,
        doubles: Number(row.total_doubles) || 0,
        triples: Number(row.total_triples) || 0,
        homeRuns: Number(row.total_home_runs) || 0,
        stolenBases: 0, // Not available in historical data
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