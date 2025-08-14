import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as path from 'path';

interface PlayerGameStats {
  playerName: string;
  gameDate: string;
  gameSheet: string;
  ab: number;
  h: number;
  r: number;
  rbi: number;
  bb: number;
  k: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
}

function parseGameDate(sheetName: string): string {
  // Extract date from sheet names like "Game 1 422", "Game 6 611" etc.
  if (sheetName.includes('422')) return '2025-04-22';
  if (sheetName.includes('429')) return '2025-04-29';
  if (sheetName.includes('512')) return '2025-05-12';
  if (sheetName.includes('521')) return '2025-05-21';
  if (sheetName.includes('64')) return '2025-06-04';
  if (sheetName.includes('611')) return '2025-06-11';
  if (sheetName.includes('627')) return '2025-06-27';
  if (sheetName.includes('716')) return '2025-07-16';
  if (sheetName.includes('87')) return '2025-08-07';
  if (sheetName.includes('811')) return '2025-08-11';
  
  return '2025-01-01'; // Fallback
}

function safeNumber(value: any): number {
  if (value === null || value === undefined || value === '' || value === '#DIV/0!') {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting stats import from Excel file...');
    
    // Read the Excel file from repo
    const filePath = path.join(process.cwd(), '2025 STATS Underhand Jobs Spring_Summer.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    console.log('📋 Found sheets:', workbook.SheetNames);
    
    // Process individual games (skip forfeit games)
    const gameSheets = workbook.SheetNames.filter(name => 
      (name.startsWith('Game ') || name.includes('Playoffs')) && !name.includes('FORFEIT')
    );
    
    console.log(`🎮 Processing ${gameSheets.length} games:`, gameSheets);
    
    const allStats: PlayerGameStats[] = [];
    
    for (const sheetName of gameSheets) {
      console.log(`📊 Processing ${sheetName}...`);
      const gameSheet = workbook.Sheets[sheetName];
      const gameData = XLSX.utils.sheet_to_json(gameSheet);
      const gameDate = parseGameDate(sheetName);
      
      console.log(`   📅 Game date: ${gameDate}`);
      console.log(`   📈 Rows in sheet: ${gameData.length}`);
      
      for (const row of gameData as any[]) {
        if (!row.Name || typeof row.Name !== 'string') continue;
        
        const name = row.Name.trim();
        
        // Skip non-player rows
        if (name.includes('GAME LINE') || name.includes('RESULT')) continue;
        
        // Only add stats if player has meaningful data
        const ab = safeNumber(row.AB);
        const h = safeNumber(row.H);
        const r = safeNumber(row.R);
        const rbi = safeNumber(row.RBI);
        
        if (ab > 0 || h > 0 || r > 0 || rbi > 0) {
          allStats.push({
            playerName: name,
            gameDate,
            gameSheet: sheetName,
            ab: safeNumber(row.AB),
            h: safeNumber(row.H),
            r: safeNumber(row.R),
            rbi: safeNumber(row.RBI),
            bb: safeNumber(row.BB),
            k: safeNumber(row.K),
            singles: safeNumber(row['1B']),
            doubles: safeNumber(row['2B']),
            triples: safeNumber(row['3B']),
            hr: safeNumber(row.HR),
          });
        }
      }
    }
    
    console.log(`✅ Processed ${allStats.length} player-game stat records`);
    
    // Import stats to database
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const stat of allStats) {
      try {
        // Find player by name
        const playerResult = await db.execute(sql`
          SELECT id FROM players 
          WHERE LOWER(CONCAT(first_name, ' ', last_name)) = LOWER(${stat.playerName})
        `);
        
        if (playerResult.length === 0) {
          console.log(`⚠️ Player not found: ${stat.playerName}`);
          skippedCount++;
          continue;
        }
        
        const playerId = (playerResult[0] as any).id;
        
        // Find game by date
        const gameResult = await db.execute(sql`
          SELECT id FROM games WHERE game_date = ${stat.gameDate}
        `);
        
        if (gameResult.length === 0) {
          console.log(`⚠️ Game not found for date: ${stat.gameDate}`);
          skippedCount++;
          continue;
        }
        
        const gameId = (gameResult[0] as any).id;
        
        // Insert or update player game stats
        await db.execute(sql`
          INSERT INTO player_game_stats (
            player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts,
            singles, doubles, triples, home_runs
          ) VALUES (
            ${playerId}, ${gameId}, ${stat.ab}, ${stat.h}, ${stat.r}, ${stat.rbi},
            ${stat.bb}, ${stat.k}, ${stat.singles}, ${stat.doubles}, ${stat.triples}, ${stat.hr}
          )
          ON CONFLICT (player_id, game_id) 
          DO UPDATE SET
            at_bats = EXCLUDED.at_bats,
            hits = EXCLUDED.hits,
            runs = EXCLUDED.runs,
            rbis = EXCLUDED.rbis,
            walks = EXCLUDED.walks,
            strikeouts = EXCLUDED.strikeouts,
            singles = EXCLUDED.singles,
            doubles = EXCLUDED.doubles,
            triples = EXCLUDED.triples,
            home_runs = EXCLUDED.home_runs
        `);
        
        importedCount++;
        
      } catch (error) {
        console.error(`❌ Error importing stat for ${stat.playerName}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`✅ Import complete: ${importedCount} imported, ${skippedCount} skipped`);
    
    return NextResponse.json({
      success: true,
      message: 'Stats imported successfully!',
      summary: {
        totalStats: allStats.length,
        imported: importedCount,
        skipped: skippedCount,
        games: gameSheets.length
      }
    });

  } catch (error) {
    console.error('❌ Stats import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Stats import failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}