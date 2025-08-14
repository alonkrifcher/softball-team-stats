#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_FILE = '2025 STATS Underhand Jobs Spring_Summer.xlsx';

interface TeamPlayer {
  name: string;
  firstName: string;
  lastName: string;
  seasonStats: {
    ab: number;
    r: number;
    h: number;
    singles: number;
    doubles: number;
    triples: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
  };
  gameStats: Array<{
    gameSheet: string;
    gameDate: string;
    ab: number;
    r: number;
    h: number;
    singles: number;
    doubles: number;
    triples: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
  }>;
}

function parseGameDate(sheetName: string): string {
  // Extract date from sheet names like "Game 1 422", "Game 6 611" etc.
  // Format appears to be Game # MMdd, so we need to add year and parse
  const match = sheetName.match(/Game \d+ (\d+)/);
  if (match) {
    const dateStr = match[1];
    if (dateStr.length === 3) {
      // Format like "422" = 4/22, "64" = 6/4
      const month = parseInt(dateStr.substring(0, 1));
      const day = parseInt(dateStr.substring(1));
      return `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else if (dateStr.length === 4) {
      // Format like "611" = 6/11
      const month = parseInt(dateStr.substring(0, 1));
      const day = parseInt(dateStr.substring(1));
      return `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else if (dateStr.length === 5) {
      // Format like "811" could be 8/11
      const month = parseInt(dateStr.substring(0, 1));
      const day = parseInt(dateStr.substring(1));
      return `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  // Fallback date parsing
  if (sheetName.includes('811')) return '2025-08-11';
  if (sheetName.includes('716')) return '2025-07-16';
  if (sheetName.includes('627')) return '2025-06-27';
  if (sheetName.includes('611')) return '2025-06-11';
  if (sheetName.includes('64')) return '2025-06-04';
  if (sheetName.includes('521')) return '2025-05-21';
  if (sheetName.includes('512')) return '2025-05-12';
  if (sheetName.includes('429')) return '2025-04-29';
  if (sheetName.includes('422')) return '2025-04-22';
  if (sheetName.includes('87')) return '2025-08-07';
  
  return '2025-01-01'; // Fallback
}

function safeNumber(value: any): number {
  if (value === null || value === undefined || value === '' || value === '#DIV/0!') {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

async function processTeamData() {
  try {
    console.log('🏟️  Processing Underhand Jobs team data...');
    
    const filePath = path.join(process.cwd(), EXCEL_FILE);
    const workbook = XLSX.readFile(filePath);
    
    // Process season totals from "2025 Season Stats" sheet
    const seasonSheet = workbook.Sheets['2025 Season Stats'];
    const seasonData = XLSX.utils.sheet_to_json(seasonSheet);
    
    console.log(`👥 Found ${seasonData.length} players in season data`);
    
    const players: Map<string, TeamPlayer> = new Map();
    
    // Process season stats
    for (const row of seasonData as any[]) {
      if (!row.Name || typeof row.Name !== 'string') continue;
      
      const name = row.Name.trim();
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;
      
      players.set(name, {
        name,
        firstName,
        lastName,
        seasonStats: {
          ab: safeNumber(row.AB),
          r: safeNumber(row.R),
          h: safeNumber(row.H),
          singles: safeNumber(row['1B']),
          doubles: safeNumber(row['2B']),
          triples: safeNumber(row['3B']),
          hr: safeNumber(row.HR),
          rbi: safeNumber(row.RBI),
          bb: safeNumber(row.BB),
          k: safeNumber(row.K),
        },
        gameStats: []
      });
    }
    
    console.log(`✅ Processed ${players.size} unique players`);
    
    // Process individual games
    const gameSheets = workbook.SheetNames.filter(name => 
      name.startsWith('Game ') || name.includes('Playoffs')
    ).filter(name => !name.includes('FORFEIT'));
    
    console.log(`🎮 Processing ${gameSheets.length} games:`, gameSheets);
    
    for (const sheetName of gameSheets) {
      console.log(`📊 Processing ${sheetName}...`);
      const gameSheet = workbook.Sheets[sheetName];
      const gameData = XLSX.utils.sheet_to_json(gameSheet);
      const gameDate = parseGameDate(sheetName);
      
      console.log(`   📅 Game date: ${gameDate}`);
      console.log(`   📈 Players with stats: ${gameData.length}`);
      
      for (const row of gameData as any[]) {
        if (!row.Name || typeof row.Name !== 'string') continue;
        
        const name = row.Name.trim();
        const player = players.get(name);
        
        if (player) {
          // Only add stats if player has meaningful data (AB > 0 or other stats)
          const ab = safeNumber(row.AB);
          const h = safeNumber(row.H);
          const r = safeNumber(row.R);
          const rbi = safeNumber(row.RBI);
          
          if (ab > 0 || h > 0 || r > 0 || rbi > 0) {
            player.gameStats.push({
              gameSheet: sheetName,
              gameDate,
              ab: safeNumber(row.AB),
              r: safeNumber(row.R),
              h: safeNumber(row.H),
              singles: safeNumber(row['1B']),
              doubles: safeNumber(row['2B']),
              triples: safeNumber(row['3B']),
              hr: safeNumber(row.HR),
              rbi: safeNumber(row.RBI),
              bb: safeNumber(row.BB),
              k: safeNumber(row.K),
            });
          }
        } else {
          console.log(`   ⚠️ Player not found in season data: ${name}`);
        }
      }
    }
    
    // Generate SQL statements
    console.log('\n🔧 Generating SQL statements...');
    
    const sqlStatements: string[] = [
      '-- Underhand Jobs Team Data Import',
      '-- Generated from: ' + EXCEL_FILE,
      '',
      '-- Step 1: Create database tables',
      `CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'manager', 'coach', 'player');`,
      `CREATE TYPE IF NOT EXISTS game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');`,
      `CREATE TYPE IF NOT EXISTS home_away AS ENUM ('home', 'away');`,
      '',
      '-- Users table',
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role user_role NOT NULL DEFAULT 'player',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      '',
      '-- Seasons table',
      `CREATE TABLE IF NOT EXISTS seasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      '',
      '-- Players table',
      `CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        jersey_number INTEGER,
        primary_position VARCHAR(10),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      '',
      '-- Games table',
      `CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        season_id INTEGER NOT NULL REFERENCES seasons(id),
        game_date DATE NOT NULL,
        opponent VARCHAR(100) NOT NULL,
        home_away home_away NOT NULL,
        our_score INTEGER,
        their_score INTEGER,
        location VARCHAR(200),
        status game_status NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      '',
      '-- Player game stats table',
      `CREATE TABLE IF NOT EXISTS player_game_stats (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id),
        game_id INTEGER NOT NULL REFERENCES games(id),
        batting_order INTEGER,
        at_bats INTEGER NOT NULL DEFAULT 0,
        hits INTEGER NOT NULL DEFAULT 0,
        runs INTEGER NOT NULL DEFAULT 0,
        rbis INTEGER NOT NULL DEFAULT 0,
        walks INTEGER NOT NULL DEFAULT 0,
        strikeouts INTEGER NOT NULL DEFAULT 0,
        singles INTEGER NOT NULL DEFAULT 0,
        doubles INTEGER NOT NULL DEFAULT 0,
        triples INTEGER NOT NULL DEFAULT 0,
        home_runs INTEGER NOT NULL DEFAULT 0,
        stolen_bases INTEGER NOT NULL DEFAULT 0,
        errors INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,
        putouts INTEGER NOT NULL DEFAULT 0,
        fielding_position VARCHAR(10),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(player_id, game_id)
      );`,
      '',
      '-- Scoring book images table',
      `CREATE TABLE IF NOT EXISTS scoring_book_images (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id),
        image_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      '',
      '-- Step 2: Insert admin and manager users',
      `INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
        ('admin@teamstats.com', '$2b$10$rH8K9zYzY5ZnYfJlQjK8.e8lLJV2vWGW6K5N5sK8K8K8K8K8K8K8Km', 'Admin', 'User', 'admin'),
        ('manager@teamstats.com', '$2b$10$rH8K9zYzY5ZnYfJlQjK8.e8lLJV2vWGW6K5N5sK8K8K8K8K8K8K8Km', 'Team', 'Manager', 'manager')
      ON CONFLICT (email) DO NOTHING;`,
      '',
      '-- Step 3: Create 2025 season',
      `INSERT INTO seasons (name, year, start_date, end_date, is_active) VALUES
        ('2025 Spring/Summer Season', 2025, '2025-04-01', '2025-08-31', true)
      ON CONFLICT DO NOTHING;`,
      '',
      '-- Step 4: Insert players',
    ];
    
    // Add player inserts
    const playerInserts: string[] = [];
    Array.from(players.values()).forEach((player, index) => {
      playerInserts.push(
        `    ('${player.firstName.replace(/'/g, "''")}', '${player.lastName.replace(/'/g, "''")}', ${index + 1}, null)`
      );
    });
    
    sqlStatements.push(
      `INSERT INTO players (first_name, last_name, jersey_number, primary_position) VALUES`,
      playerInserts.join(',\n') + ';',
      ''
    );
    
    // Add games
    const uniqueGames = new Set<string>();
    Array.from(players.values()).forEach(player => {
      player.gameStats.forEach(game => {
        uniqueGames.add(game.gameDate + '|' + game.gameSheet);
      });
    });
    
    const sortedGames = Array.from(uniqueGames).sort();
    const gameInserts: string[] = [];
    
    sortedGames.forEach(gameKey => {
      const [date, sheetName] = gameKey.split('|');
      const opponent = sheetName.includes('Playoffs') ? 'Playoff Opponent' : 'Unknown Opponent';
      gameInserts.push(
        `    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '${date}', '${opponent}', 'home', null, null, null, 'completed')`
      );
    });
    
    sqlStatements.push(
      '-- Step 5: Insert games',
      `INSERT INTO games (season_id, game_date, opponent, home_away, our_score, their_score, location, status) VALUES`,
      gameInserts.join(',\n') + ';',
      ''
    );
    
    // Add player game stats
    sqlStatements.push('-- Step 6: Insert player game statistics');
    
    Array.from(players.values()).forEach(player => {
      player.gameStats.forEach((game, gameIndex) => {
        sqlStatements.push(
          `INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)`,
          `SELECT p.id, g.id, ${game.ab}, ${game.h}, ${game.r}, ${game.rbi}, ${game.bb}, ${game.k}, ${game.singles}, ${game.doubles}, ${game.triples}, ${game.hr}`,
          `FROM players p, games g`,
          `WHERE p.first_name = '${player.firstName.replace(/'/g, "''")}' AND p.last_name = '${player.lastName.replace(/'/g, "''")}'`,
          `  AND g.game_date = '${game.gameDate}' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)`,
          `ON CONFLICT (player_id, game_id) DO UPDATE SET`,
          `  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,`,
          `  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,`,
          `  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;`,
          ''
        );
      });
    });
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n');
    const outputFile = 'underhand-jobs-import.sql';
    fs.writeFileSync(outputFile, sqlContent);
    
    console.log(`\n✅ Generated SQL import file: ${outputFile}`);
    console.log(`📊 Summary:`);
    console.log(`   👥 Players: ${players.size}`);
    console.log(`   🎮 Games: ${sortedGames.length}`);
    
    let totalGameStats = 0;
    Array.from(players.values()).forEach(player => {
      totalGameStats += player.gameStats.length;
    });
    console.log(`   📈 Player-game stat records: ${totalGameStats}`);
    
    // Show some sample data
    console.log('\n📋 Sample players:');
    Array.from(players.values()).slice(0, 5).forEach(player => {
      console.log(`   ${player.name}: ${player.seasonStats.ab} AB, ${player.seasonStats.h} H, ${player.gameStats.length} games`);
    });
    
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Review the generated SQL file: ${outputFile}`);
    console.log(`   2. Run it against your database to import the data`);
    console.log(`   3. Or use the web setup page with this processed data`);

  } catch (error) {
    console.error('❌ Error processing team data:', error);
  }
}

// Run the processing
processTeamData();