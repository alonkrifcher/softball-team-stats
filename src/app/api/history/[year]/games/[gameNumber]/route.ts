import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string; gameNumber: string } }
) {
  try {
    const year = parseInt(params.year);
    const gameNumber = parseInt(params.gameNumber);
    
    if (isNaN(year) || isNaN(gameNumber)) {
      return NextResponse.json(
        { error: 'Invalid year or game number parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching game ${gameNumber} stats for year ${year}...`);

    // Get game info and player stats
    const gameStats = await db.execute(sql`
      SELECT 
        hg.id,
        hg.game_number,
        hg.game_date,
        hg.opponent,
        hg.result,
        hg.uhj_runs,
        hg.opp_runs,
        hp.name as player_name,
        hp.gender,
        hpg.avg,
        hpg.at_bats,
        hpg.runs,
        hpg.hits,
        hpg.singles,
        hpg.doubles,
        hpg.triples,
        hpg.home_runs,
        hpg.xbh,
        hpg.total_bases,
        hpg.rbis,
        hpg.sacrifice,
        hpg.walks,
        hpg.strikeouts,
        hpg.slg,
        hpg.obp,
        hpg.ops,
        hpg.eqa,
        hpg.on_base_numerator,
        hpg.on_base_denominator
      FROM historical_games hg
      LEFT JOIN historical_player_games hpg ON hg.id = hpg.game_id
      LEFT JOIN historical_players hp ON hpg.player_id = hp.id
      WHERE hg.season_year = ${year} AND hg.game_number = ${gameNumber}
      ORDER BY hp.name ASC
    `);

    if (gameStats.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    console.log(`📊 Found ${gameStats.length} player stats for game ${gameNumber}`);

    const firstRow = gameStats[0] as any;
    const gameInfo = {
      id: firstRow.id,
      gameNumber: firstRow.game_number,
      gameDate: firstRow.game_date,
      opponent: firstRow.opponent || 'Unknown Opponent',
      result: firstRow.result || '',
      uhjRuns: firstRow.uhj_runs,
      oppRuns: firstRow.opp_runs,
    };

    const playerStats = gameStats
      .filter((stat: any) => stat.player_name) // Only include rows with player data
      .map((stat: any) => ({
        playerName: stat.player_name,
        gender: stat.gender,
        avg: parseFloat(stat.avg) || 0,
        atBats: stat.at_bats || 0,
        runs: stat.runs || 0,
        hits: stat.hits || 0,
        singles: stat.singles || 0,
        doubles: stat.doubles || 0,
        triples: stat.triples || 0,
        homeRuns: stat.home_runs || 0,
        xbh: stat.xbh || 0,
        totalBases: stat.total_bases || 0,
        rbis: stat.rbis || 0,
        sacrifice: stat.sacrifice || 0,
        walks: stat.walks || 0,
        strikeouts: stat.strikeouts || 0,
        slg: parseFloat(stat.slg) || 0,
        obp: parseFloat(stat.obp) || 0,
        ops: parseFloat(stat.ops) || 0,
        eqa: parseFloat(stat.eqa) || 0,
        onBaseNumerator: stat.on_base_numerator || 0,
        onBaseDenominator: stat.on_base_denominator || 0,
      }));

    console.log('✅ Processed game stats result');
    return NextResponse.json({
      game: gameInfo,
      playerStats: playerStats
    });

  } catch (error) {
    console.error(`Error fetching game ${params.gameNumber} stats for year ${params.year}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    );
  }
}