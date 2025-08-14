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

    console.log(`🔍 Fetching player season stats for year ${year}...`);

    // Get aggregated player stats for the season
    const playerStats = await db.execute(sql`
      SELECT 
        hp.name as player_name,
        hp.gender,
        COUNT(hpg.id) as games_played,
        SUM(hpg.at_bats) as total_at_bats,
        SUM(hpg.runs) as total_runs,
        SUM(hpg.hits) as total_hits,
        SUM(hpg.singles) as total_singles,
        SUM(hpg.doubles) as total_doubles,
        SUM(hpg.triples) as total_triples,
        SUM(hpg.home_runs) as total_home_runs,
        SUM(hpg.xbh) as total_xbh,
        SUM(hpg.total_bases) as total_bases,
        SUM(hpg.rbis) as total_rbis,
        SUM(hpg.sacrifice) as total_sacrifice,
        SUM(hpg.walks) as total_walks,
        SUM(hpg.strikeouts) as total_strikeouts,
        SUM(hpg.on_base_numerator) as total_on_base_num,
        SUM(hpg.on_base_denominator) as total_on_base_denom,
        -- Calculate season averages
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.hits)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as season_avg,
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.total_bases)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as season_slg,
        CASE 
          WHEN SUM(hpg.on_base_denominator) > 0 
          THEN ROUND(SUM(hpg.on_base_numerator)::decimal / SUM(hpg.on_base_denominator)::decimal, 3)
          ELSE 0 
        END as season_obp
      FROM historical_players hp
      INNER JOIN historical_player_games hpg ON hp.id = hpg.player_id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      WHERE hg.season_year = ${year}
      GROUP BY hp.name, hp.gender
      ORDER BY total_at_bats DESC, season_avg DESC, hp.name ASC
    `);

    console.log(`📊 Found ${playerStats.length} players for ${year} season`);

    const result = playerStats.map(player => {
      const p = player as any;
      const seasonAvg = parseFloat(p.season_avg) || 0;
      const seasonSlg = parseFloat(p.season_slg) || 0;
      const seasonObp = parseFloat(p.season_obp) || 0;
      const seasonOps = seasonObp + seasonSlg;

      return {
        playerName: p.player_name,
        gender: p.gender,
        gamesPlayed: parseInt(p.games_played) || 0,
        atBats: parseInt(p.total_at_bats) || 0,
        runs: parseInt(p.total_runs) || 0,
        hits: parseInt(p.total_hits) || 0,
        singles: parseInt(p.total_singles) || 0,
        doubles: parseInt(p.total_doubles) || 0,
        triples: parseInt(p.total_triples) || 0,
        homeRuns: parseInt(p.total_home_runs) || 0,
        xbh: parseInt(p.total_xbh) || 0,
        totalBases: parseInt(p.total_bases) || 0,
        rbis: parseInt(p.total_rbis) || 0,
        sacrifice: parseInt(p.total_sacrifice) || 0,
        walks: parseInt(p.total_walks) || 0,
        strikeouts: parseInt(p.total_strikeouts) || 0,
        avg: seasonAvg,
        slg: seasonSlg,
        obp: seasonObp,
        ops: seasonOps,
      };
    });

    console.log('✅ Processed player season stats result');
    return NextResponse.json(result);

  } catch (error) {
    console.error(`Error fetching player stats for year ${params.year}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}