import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface PlayerGameRow {
  Year: number;
  Game: number;
  Date: string;
  Opponent: string;
  Result: string;
  'UHJ Runs': number | null;
  'Opp Runs': number | null;
  Name: string;
  Gender: string;
  Avg: number;
  AB: number;
  R: number;
  H: number;
  '1B': number;
  '2B': number;
  '3B': number;
  HR: number;
  XBH: number;
  TB: number;
  RBI: number;
  Sac: number;
  BB: number;
  K: number;
  SLG: number;
  OBP: number;
  OPS: number;
  EqA: number;
  On_base_num: number;
  On_base_denom: number;
}

function parseCSVRow(line: string): PlayerGameRow | null {
  // Try tab-delimited first, then comma-delimited
  let values = line.split('\t');
  if (values.length < 10) {
    values = line.split(',');
  }
  
  console.log(`Parsing line with ${values.length} values:`, values.slice(0, 10));
  
  if (values.length < 20) {
    console.log(`Skipping line - only ${values.length} values (need at least 20)`);
    return null;
  }
  
  try {
    return {
      Year: parseInt(values[0]) || 0,
      Game: parseInt(values[1]) || 0,
      Date: values[2] || '',
      Opponent: values[3] || 'Unknown',
      Result: values[4] || '',
      'UHJ Runs': values[5] ? parseInt(values[5]) : null,
      'Opp Runs': values[6] ? parseInt(values[6]) : null,
      Name: values[7] || '',
      Gender: values[8] || '',
      Avg: parseFloat(values[9]) || 0,
      AB: parseInt(values[10]) || 0,
      R: parseInt(values[11]) || 0,
      H: parseInt(values[12]) || 0,
      '1B': parseInt(values[13]) || 0,
      '2B': parseInt(values[14]) || 0,
      '3B': parseInt(values[15]) || 0,
      HR: parseInt(values[16]) || 0,
      XBH: parseInt(values[17]) || 0,
      TB: parseInt(values[18]) || 0,
      RBI: parseInt(values[19]) || 0,
      Sac: parseInt(values[20]) || 0,
      BB: parseInt(values[21]) || 0,
      K: parseInt(values[22]) || 0,
      SLG: parseFloat(values[23]) || 0,
      OBP: parseFloat(values[24]) || 0,
      OPS: parseFloat(values[25]) || 0,
      EqA: parseFloat(values[26]) || 0,
      On_base_num: parseInt(values[27]) || 0,
      On_base_denom: parseInt(values[28]) || 0,
    };
  } catch (error) {
    console.error('Error parsing row:', line, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting all-time stats CSV import...');
    
    // Create new simplified tables for historical data
    await db.execute(sql`
      DROP TABLE IF EXISTS historical_player_games CASCADE;
      DROP TABLE IF EXISTS historical_games CASCADE;
      DROP TABLE IF EXISTS historical_seasons CASCADE;
      DROP TABLE IF EXISTS historical_players CASCADE;
    `);
    
    console.log('✅ Dropped existing historical tables');

    // Create historical tables
    await db.execute(sql`
      CREATE TABLE historical_seasons (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE historical_players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(1),
        first_year INTEGER,
        last_year INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(name)
      );
      
      CREATE TABLE historical_games (
        id SERIAL PRIMARY KEY,
        season_year INTEGER NOT NULL REFERENCES historical_seasons(year),
        game_number INTEGER NOT NULL,
        game_date DATE,
        opponent VARCHAR(100),
        result VARCHAR(10),
        uhj_runs INTEGER,
        opp_runs INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(season_year, game_number)
      );
      
      CREATE TABLE historical_player_games (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES historical_games(id),
        player_id INTEGER NOT NULL REFERENCES historical_players(id),
        avg DECIMAL(4,3),
        at_bats INTEGER NOT NULL DEFAULT 0,
        runs INTEGER NOT NULL DEFAULT 0,
        hits INTEGER NOT NULL DEFAULT 0,
        singles INTEGER NOT NULL DEFAULT 0,
        doubles INTEGER NOT NULL DEFAULT 0,
        triples INTEGER NOT NULL DEFAULT 0,
        home_runs INTEGER NOT NULL DEFAULT 0,
        xbh INTEGER NOT NULL DEFAULT 0,
        total_bases INTEGER NOT NULL DEFAULT 0,
        rbis INTEGER NOT NULL DEFAULT 0,
        sacrifice INTEGER NOT NULL DEFAULT 0,
        walks INTEGER NOT NULL DEFAULT 0,
        strikeouts INTEGER NOT NULL DEFAULT 0,
        slg DECIMAL(4,3),
        obp DECIMAL(4,3),
        ops DECIMAL(4,3),
        eqa DECIMAL(4,3),
        on_base_numerator INTEGER NOT NULL DEFAULT 0,
        on_base_denominator INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(game_id, player_id)
      );
    `);

    console.log('✅ Created historical tables');

    // Read CSV file (you'll need to upload this)
    const { csvData } = await request.json();
    
    if (!csvData) {
      return NextResponse.json(
        { error: 'No CSV data provided' },
        { status: 400 }
      );
    }

    const lines = csvData.split('\n');
    const headerLine = lines[0];
    const dataLines = lines.slice(1).filter((line: string) => line.trim());
    
    console.log(`📄 Processing ${dataLines.length} data rows`);
    console.log(`Header: ${headerLine}`);
    console.log(`Sample lines:`, dataLines.slice(0, 3));
    
    const seasons = new Set<number>();
    const players = new Map<string, { gender: string; firstYear: number; lastYear: number }>();
    const games = new Map<string, PlayerGameRow>();
    const playerGameStats: PlayerGameRow[] = [];
    
    // Parse all rows and collect unique data
    for (const line of dataLines) {
      const row = parseCSVRow(line);
      if (!row) {
        console.log('Failed to parse row');
        continue;
      }
      if (!row.Name || !row.Year) {
        console.log('Row missing name or year:', row);
        continue;
      }
      
      seasons.add(row.Year);
      
      // Track player info
      if (!players.has(row.Name)) {
        players.set(row.Name, {
          gender: row.Gender,
          firstYear: row.Year,
          lastYear: row.Year
        });
      } else {
        const existing = players.get(row.Name)!;
        existing.firstYear = Math.min(existing.firstYear, row.Year);
        existing.lastYear = Math.max(existing.lastYear, row.Year);
      }
      
      // Track games
      const gameKey = `${row.Year}-${row.Game}`;
      if (!games.has(gameKey)) {
        games.set(gameKey, row);
      }
      
      playerGameStats.push(row);
    }
    
    console.log(`📊 Found ${seasons.size} seasons, ${players.size} players, ${games.size} games`);
    
    // Insert seasons
    for (const year of Array.from(seasons)) {
      await db.execute(sql`
        INSERT INTO historical_seasons (year) VALUES (${year})
        ON CONFLICT (year) DO NOTHING
      `);
    }
    
    // Insert players
    for (const [name, info] of Array.from(players)) {
      await db.execute(sql`
        INSERT INTO historical_players (name, gender, first_year, last_year) 
        VALUES (${name}, ${info.gender}, ${info.firstYear}, ${info.lastYear})
        ON CONFLICT (name) DO UPDATE SET
          first_year = LEAST(historical_players.first_year, EXCLUDED.first_year),
          last_year = GREATEST(historical_players.last_year, EXCLUDED.last_year)
      `);
    }
    
    // Insert games
    for (const [gameKey, gameData] of Array.from(games)) {
      const gameDate = gameData.Date ? new Date(gameData.Date) : null;
      
      await db.execute(sql`
        INSERT INTO historical_games (
          season_year, game_number, game_date, opponent, result, uhj_runs, opp_runs
        ) VALUES (
          ${gameData.Year}, ${gameData.Game}, ${gameDate}, ${gameData.Opponent || null}, 
          ${gameData.Result || null}, ${gameData['UHJ Runs']}, ${gameData['Opp Runs']}
        )
        ON CONFLICT (season_year, game_number) DO UPDATE SET
          game_date = EXCLUDED.game_date,
          opponent = EXCLUDED.opponent,
          result = EXCLUDED.result,
          uhj_runs = EXCLUDED.uhj_runs,
          opp_runs = EXCLUDED.opp_runs
      `);
    }
    
    // Insert player game stats
    let importedStats = 0;
    for (const stat of playerGameStats) {
      try {
        // Get player ID
        const playerResult = await db.execute(sql`
          SELECT id FROM historical_players WHERE name = ${stat.Name}
        `);
        
        if (playerResult.length === 0) continue;
        const playerId = (playerResult[0] as any).id;
        
        // Get game ID
        const gameResult = await db.execute(sql`
          SELECT id FROM historical_games 
          WHERE season_year = ${stat.Year} AND game_number = ${stat.Game}
        `);
        
        if (gameResult.length === 0) continue;
        const gameId = (gameResult[0] as any).id;
        
        // Insert player game stats
        await db.execute(sql`
          INSERT INTO historical_player_games (
            game_id, player_id, avg, at_bats, runs, hits, singles, doubles, triples,
            home_runs, xbh, total_bases, rbis, sacrifice, walks, strikeouts,
            slg, obp, ops, eqa, on_base_numerator, on_base_denominator
          ) VALUES (
            ${gameId}, ${playerId}, ${stat.Avg}, ${stat.AB}, ${stat.R}, ${stat.H},
            ${stat['1B']}, ${stat['2B']}, ${stat['3B']}, ${stat.HR}, ${stat.XBH},
            ${stat.TB}, ${stat.RBI}, ${stat.Sac}, ${stat.BB}, ${stat.K},
            ${stat.SLG}, ${stat.OBP}, ${stat.OPS}, ${stat.EqA},
            ${stat.On_base_num}, ${stat.On_base_denom}
          )
          ON CONFLICT (game_id, player_id) DO UPDATE SET
            avg = EXCLUDED.avg,
            at_bats = EXCLUDED.at_bats,
            runs = EXCLUDED.runs,
            hits = EXCLUDED.hits,
            singles = EXCLUDED.singles,
            doubles = EXCLUDED.doubles,
            triples = EXCLUDED.triples,
            home_runs = EXCLUDED.home_runs,
            xbh = EXCLUDED.xbh,
            total_bases = EXCLUDED.total_bases,
            rbis = EXCLUDED.rbis,
            sacrifice = EXCLUDED.sacrifice,
            walks = EXCLUDED.walks,
            strikeouts = EXCLUDED.strikeouts,
            slg = EXCLUDED.slg,
            obp = EXCLUDED.obp,
            ops = EXCLUDED.ops,
            eqa = EXCLUDED.eqa,
            on_base_numerator = EXCLUDED.on_base_numerator,
            on_base_denominator = EXCLUDED.on_base_denominator
        `);
        
        importedStats++;
        
      } catch (error) {
        console.error(`Error importing stat for ${stat.Name}:`, error);
      }
    }
    
    console.log(`✅ Import complete: ${importedStats} player-game stats imported`);
    
    return NextResponse.json({
      success: true,
      message: 'All-time stats imported successfully!',
      summary: {
        seasons: seasons.size,
        players: players.size,
        games: games.size,
        playerGameStats: importedStats
      }
    });

  } catch (error) {
    console.error('❌ CSV import error:', error);
    
    return NextResponse.json(
      { 
        error: 'CSV import failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}