import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('🏆 Fetching all-time career statistics...');

    // Get career statistics for all players
    const careerStats = await db.execute(sql`
      SELECT 
        hp.name as player_name,
        hp.gender,
        hp.first_year,
        hp.last_year,
        COUNT(hpg.id) as total_games,
        COUNT(DISTINCT hg.season_year) as seasons_played,
        SUM(hpg.at_bats) as career_at_bats,
        SUM(hpg.runs) as career_runs,
        SUM(hpg.hits) as career_hits,
        SUM(hpg.singles) as career_singles,
        SUM(hpg.doubles) as career_doubles,
        SUM(hpg.triples) as career_triples,
        SUM(hpg.home_runs) as career_home_runs,
        SUM(hpg.xbh) as career_xbh,
        SUM(hpg.total_bases) as career_total_bases,
        SUM(hpg.rbis) as career_rbis,
        SUM(hpg.sacrifice) as career_sacrifice,
        SUM(hpg.walks) as career_walks,
        SUM(hpg.strikeouts) as career_strikeouts,
        SUM(hpg.on_base_numerator) as career_on_base_num,
        SUM(hpg.on_base_denominator) as career_on_base_denom,
        -- Calculate career averages
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.hits)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as career_avg,
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.total_bases)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as career_slg,
        CASE 
          WHEN SUM(hpg.on_base_denominator) > 0 
          THEN ROUND(SUM(hpg.on_base_numerator)::decimal / SUM(hpg.on_base_denominator)::decimal, 3)
          ELSE 0 
        END as career_obp
      FROM historical_players hp
      INNER JOIN historical_player_games hpg ON hp.id = hpg.player_id
      INNER JOIN historical_games hg ON hpg.game_id = hg.id
      GROUP BY hp.name, hp.gender, hp.first_year, hp.last_year
      HAVING SUM(hpg.at_bats) >= 10  -- Filter out players with very few at-bats
      ORDER BY SUM(hpg.at_bats) DESC, career_avg DESC, hp.name ASC
    `);

    // Get team totals across all seasons
    const teamTotals = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT hg.season_year) as total_seasons,
        COUNT(DISTINCT hg.id) as total_games,
        COUNT(DISTINCT hp.id) as total_players,
        COUNT(hpg.id) as total_player_games,
        SUM(hpg.at_bats) as total_at_bats,
        SUM(hpg.runs) as total_runs,
        SUM(hpg.hits) as total_hits,
        SUM(hpg.home_runs) as total_home_runs,
        SUM(hpg.rbis) as total_rbis,
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.hits)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as team_avg_all_time
      FROM historical_games hg
      INNER JOIN historical_player_games hpg ON hg.id = hpg.game_id
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
    `);

    // Get season-by-season team performance
    const seasonSummary = await db.execute(sql`
      SELECT 
        hg.season_year,
        COUNT(DISTINCT hg.id) as games,
        SUM(CASE WHEN hg.result LIKE 'W%' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN hg.result LIKE 'L%' THEN 1 ELSE 0 END) as losses,
        COUNT(DISTINCT hp.id) as players,
        SUM(hpg.at_bats) as season_at_bats,
        SUM(hpg.hits) as season_hits,
        SUM(hpg.home_runs) as season_home_runs,
        CASE 
          WHEN SUM(hpg.at_bats) > 0 
          THEN ROUND(SUM(hpg.hits)::decimal / SUM(hpg.at_bats)::decimal, 3)
          ELSE 0 
        END as season_avg
      FROM historical_games hg
      INNER JOIN historical_player_games hpg ON hg.id = hpg.game_id
      INNER JOIN historical_players hp ON hpg.player_id = hp.id
      GROUP BY hg.season_year
      ORDER BY hg.season_year DESC
    `);

    console.log(`📊 Found ${careerStats.length} players with career stats`);

    const processedCareerStats = careerStats.map(player => {
      const p = player as any;
      const careerAvg = parseFloat(p.career_avg) || 0;
      const careerSlg = parseFloat(p.career_slg) || 0;
      const careerObp = parseFloat(p.career_obp) || 0;
      const careerOps = careerObp + careerSlg;
      const years = p.last_year - p.first_year + 1;

      return {
        playerName: p.player_name,
        gender: p.gender,
        firstYear: p.first_year,
        lastYear: p.last_year,
        yearsActive: years,
        totalGames: parseInt(p.total_games) || 0,
        seasonsPlayed: parseInt(p.seasons_played) || 0,
        careerAtBats: parseInt(p.career_at_bats) || 0,
        careerRuns: parseInt(p.career_runs) || 0,
        careerHits: parseInt(p.career_hits) || 0,
        careerSingles: parseInt(p.career_singles) || 0,
        careerDoubles: parseInt(p.career_doubles) || 0,
        careerTriples: parseInt(p.career_triples) || 0,
        careerHomeRuns: parseInt(p.career_home_runs) || 0,
        careerXbh: parseInt(p.career_xbh) || 0,
        careerTotalBases: parseInt(p.career_total_bases) || 0,
        careerRbis: parseInt(p.career_rbis) || 0,
        careerSacrifice: parseInt(p.career_sacrifice) || 0,
        careerWalks: parseInt(p.career_walks) || 0,
        careerStrikeouts: parseInt(p.career_strikeouts) || 0,
        careerAvg: careerAvg,
        careerSlg: careerSlg,
        careerObp: careerObp,
        careerOps: careerOps,
        gamesPerSeason: years > 0 ? Math.round((parseInt(p.total_games) || 0) / years * 10) / 10 : 0
      };
    });

    const processedSeasonSummary = seasonSummary.map(season => {
      const s = season as any;
      const wins = parseInt(s.wins) || 0;
      const losses = parseInt(s.losses) || 0;
      const winPct = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 1000) / 1000 : 0;

      return {
        year: s.season_year,
        games: parseInt(s.games) || 0,
        wins: wins,
        losses: losses,
        winPct: winPct,
        record: wins > 0 || losses > 0 ? `${wins}-${losses}` : 'Unknown',
        players: parseInt(s.players) || 0,
        teamAvg: parseFloat(s.season_avg) || 0,
        homeRuns: parseInt(s.season_home_runs) || 0
      };
    });

    console.log('✅ Processed all-time statistics');
    return NextResponse.json({
      careerStats: processedCareerStats,
      teamTotals: teamTotals[0],
      seasonSummary: processedSeasonSummary
    });

  } catch (error) {
    console.error('Error fetching all-time stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all-time stats' },
      { status: 500 }
    );
  }
}