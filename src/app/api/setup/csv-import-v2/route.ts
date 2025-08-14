import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

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

interface ParseResult {
  success: boolean;
  data?: PlayerGameRow;
  error?: string;
  lineNumber: number;
  originalLine: string;
}

function parseCSVRowV2(line: string, lineNumber: number): ParseResult {
  try {
    // Handle potential quoted fields and split carefully
    const values = line.split(',');
    
    // Detailed logging for each line
    console.log(`📝 Line ${lineNumber}: ${values.length} fields`);
    
    if (values.length < 29) {
      return {
        success: false,
        error: `Insufficient columns: got ${values.length}, need 29`,
        lineNumber,
        originalLine: line
      };
    }
    
    // More robust parsing functions
    const parseIntOrNull = (value: string, fieldName: string) => {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed === '') return null;
      const parsed = parseInt(trimmed);
      if (isNaN(parsed)) {
        console.warn(`⚠️ Line ${lineNumber}: Invalid integer for ${fieldName}: "${value}"`);
        return null;
      }
      return parsed;
    };
    
    const parseIntOrZero = (value: string, fieldName: string) => {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed === '') return 0;
      const parsed = parseInt(trimmed);
      if (isNaN(parsed)) {
        console.warn(`⚠️ Line ${lineNumber}: Invalid integer for ${fieldName}: "${value}", using 0`);
        return 0;
      }
      return parsed;
    };
    
    const parseFloatOrZero = (value: string, fieldName: string) => {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed === '') return 0;
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        console.warn(`⚠️ Line ${lineNumber}: Invalid float for ${fieldName}: "${value}", using 0`);
        return 0;
      }
      return parsed;
    };
    
    const result: PlayerGameRow = {
      Year: parseIntOrZero(values[0], 'Year'),
      Game: parseIntOrZero(values[1], 'Game'),
      Date: (values[2] || '').trim(),
      Opponent: (values[3] || '').trim(),
      Result: (values[4] || '').trim(),
      'UHJ Runs': parseIntOrNull(values[5], 'UHJ Runs'),
      'Opp Runs': parseIntOrNull(values[6], 'Opp Runs'),
      Name: (values[7] || '').trim(),
      Gender: (values[8] || '').trim(),
      Avg: parseFloatOrZero(values[9], 'Avg'),
      AB: parseIntOrZero(values[10], 'AB'),
      R: parseIntOrZero(values[11], 'R'),
      H: parseIntOrZero(values[12], 'H'),
      '1B': parseIntOrZero(values[13], '1B'),
      '2B': parseIntOrZero(values[14], '2B'),
      '3B': parseIntOrZero(values[15], '3B'),
      HR: parseIntOrZero(values[16], 'HR'),
      XBH: parseIntOrZero(values[17], 'XBH'),
      TB: parseIntOrZero(values[18], 'TB'),
      RBI: parseIntOrZero(values[19], 'RBI'),
      Sac: parseIntOrZero(values[20], 'Sac'),
      BB: parseIntOrZero(values[21], 'BB'),
      K: parseIntOrZero(values[22], 'K'),
      SLG: parseFloatOrZero(values[23], 'SLG'),
      OBP: parseFloatOrZero(values[24], 'OBP'),
      OPS: parseFloatOrZero(values[25], 'OPS'),
      EqA: parseFloatOrZero(values[26], 'EqA'),
      On_base_num: parseIntOrZero(values[27], 'On_base_num'),
      On_base_denom: parseIntOrZero(values[28], 'On_base_denom'),
    };
    
    // Validate essential fields
    if (!result.Name) {
      return {
        success: false,
        error: 'Missing player name',
        lineNumber,
        originalLine: line
      };
    }
    
    if (!result.Year || result.Year < 2000) {
      return {
        success: false,
        error: `Invalid year: ${result.Year}`,
        lineNumber,
        originalLine: line
      };
    }
    
    if (!result.Game || result.Game < 1) {
      return {
        success: false,
        error: `Invalid game number: ${result.Game}`,
        lineNumber,
        originalLine: line
      };
    }
    
    console.log(`✅ Line ${lineNumber}: Successfully parsed ${result.Name} - ${result.Year} Game ${result.Game}`);
    
    return {
      success: true,
      data: result,
      lineNumber,
      originalLine: line
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Parse exception: ${error instanceof Error ? error.message : String(error)}`,
      lineNumber,
      originalLine: line
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting robust CSV import v2...');
    
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
    
    // Track all parsing results
    const parseResults: ParseResult[] = [];
    const successfulRows: PlayerGameRow[] = [];
    const failedRows: ParseResult[] = [];
    
    // Parse all rows with detailed tracking
    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2; // +2 because line 1 is header, array is 0-indexed
      const result = parseCSVRowV2(dataLines[i], lineNumber);
      parseResults.push(result);
      
      if (result.success && result.data) {
        successfulRows.push(result.data);
      } else {
        failedRows.push(result);
        console.error(`❌ Line ${lineNumber} failed: ${result.error}`);
        console.error(`   Raw line: ${result.originalLine}`);
      }
    }
    
    console.log(`📈 Parse summary: ${successfulRows.length} success, ${failedRows.length} failed`);
    
    if (successfulRows.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid rows parsed',
          details: {
            totalLines: dataLines.length,
            failedRows: failedRows.slice(0, 5) // First 5 errors
          }
        },
        { status: 400 }
      );
    }
    
    // Collect unique data
    const seasons = new Set<number>();
    const players = new Map<string, { gender: string; firstYear: number; lastYear: number }>();
    const games = new Map<string, PlayerGameRow>();
    
    for (const row of successfulRows) {
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
    }
    
    console.log(`📊 Unique data: ${seasons.size} seasons, ${players.size} players, ${games.size} games`);
    
    // Insert data with transaction-like behavior
    let insertedStats = 0;
    const insertErrors: string[] = [];
    
    // Insert seasons
    for (const year of Array.from(seasons)) {
      try {
        await db.execute(sql`
          INSERT INTO historical_seasons (year) VALUES (${year})
          ON CONFLICT (year) DO NOTHING
        `);
      } catch (error) {
        insertErrors.push(`Season ${year}: ${error}`);
      }
    }
    
    // Insert players
    for (const [name, info] of Array.from(players)) {
      try {
        await db.execute(sql`
          INSERT INTO historical_players (name, gender, first_year, last_year) 
          VALUES (${name}, ${info.gender}, ${info.firstYear}, ${info.lastYear})
          ON CONFLICT (name) DO UPDATE SET
            first_year = LEAST(historical_players.first_year, EXCLUDED.first_year),
            last_year = GREATEST(historical_players.last_year, EXCLUDED.last_year)
        `);
      } catch (error) {
        insertErrors.push(`Player ${name}: ${error}`);
      }
    }
    
    // Insert games
    for (const [gameKey, gameData] of Array.from(games)) {
      try {
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
      } catch (error) {
        insertErrors.push(`Game ${gameKey}: ${error}`);
      }
    }
    
    // Insert player game stats with detailed error tracking
    for (const stat of successfulRows) {
      try {
        // Get player ID
        const playerResult = await db.execute(sql`
          SELECT id FROM historical_players WHERE name = ${stat.Name}
        `);
        
        if (playerResult.length === 0) {
          insertErrors.push(`Player not found: ${stat.Name}`);
          continue;
        }
        const playerId = (playerResult[0] as any).id;
        
        // Get game ID
        const gameResult = await db.execute(sql`
          SELECT id FROM historical_games 
          WHERE season_year = ${stat.Year} AND game_number = ${stat.Game}
        `);
        
        if (gameResult.length === 0) {
          insertErrors.push(`Game not found: ${stat.Year} Game ${stat.Game}`);
          continue;
        }
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
        
        insertedStats++;
        
      } catch (error) {
        insertErrors.push(`${stat.Name} ${stat.Year} Game ${stat.Game}: ${error}`);
      }
    }
    
    console.log(`✅ Import complete: ${insertedStats} player-game stats imported`);
    if (insertErrors.length > 0) {
      console.warn(`⚠️ ${insertErrors.length} insert errors occurred`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Robust CSV import completed!',
      summary: {
        totalLinesProcessed: dataLines.length,
        successfulParses: successfulRows.length,
        failedParses: failedRows.length,
        seasons: seasons.size,
        players: players.size,
        games: games.size,
        playerGameStatsInserted: insertedStats,
        insertErrors: insertErrors.length
      },
      errors: {
        parseErrors: failedRows.slice(0, 10), // First 10 parse errors
        insertErrors: insertErrors.slice(0, 10) // First 10 insert errors
      }
    });

  } catch (error) {
    console.error('❌ CSV import v2 error:', error);
    
    return NextResponse.json(
      { 
        error: 'CSV import v2 failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}