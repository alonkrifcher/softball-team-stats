import { NextRequest, NextResponse } from 'next/server';
import { db, users, seasons, players, games, playerGameStats } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sql } from 'drizzle-orm';

// Team data processed from Excel file
const TEAM_DATA = {
  players: [
    { firstName: 'Chloe', lastName: 'Amarilla', jerseyNumber: 1 },
    { firstName: 'Alyssa', lastName: 'Andrews', jerseyNumber: 2 },
    { firstName: 'Lara', lastName: 'Horwitz', jerseyNumber: 3 },
    { firstName: 'Miranda', lastName: 'Kahn', jerseyNumber: 4 },
    { firstName: 'Rebecca', lastName: 'Klapper', jerseyNumber: 5 },
    { firstName: 'Amy', lastName: 'Koenig', jerseyNumber: 6 },
    { firstName: 'Dahlia', lastName: 'Krueger', jerseyNumber: 7 },
    { firstName: 'Zoe', lastName: 'Lichtenbaum', jerseyNumber: 8 },
    { firstName: 'Cynthia', lastName: 'Liu', jerseyNumber: 9 },
    { firstName: 'Rachel', lastName: 'Maleh', jerseyNumber: 10 },
    { firstName: 'Leah', lastName: 'Mendelson', jerseyNumber: 11 },
    { firstName: 'Shannon', lastName: 'Murphy', jerseyNumber: 12 },
    { firstName: 'Lindsay', lastName: 'Napoli', jerseyNumber: 13 },
    { firstName: 'Cady', lastName: 'Peckman', jerseyNumber: 14 },
    { firstName: 'Lisa', lastName: 'Piacentini', jerseyNumber: 15 },
    { firstName: 'Donna', lastName: 'Raftery', jerseyNumber: 16 },
    { firstName: 'Kira', lastName: 'Salko', jerseyNumber: 17 },
    { firstName: 'Sabrina', lastName: 'Schnurman', jerseyNumber: 18 },
    { firstName: 'Sarah', lastName: 'Shandera', jerseyNumber: 19 },
    { firstName: 'Julie', lastName: 'Stein', jerseyNumber: 20 },
    { firstName: 'Lynn', lastName: 'Urdaneta', jerseyNumber: 21 },
    { firstName: 'Sarah', lastName: 'Weinstein', jerseyNumber: 22 },
    { firstName: 'Cheryl', lastName: 'Wieselman', jerseyNumber: 23 },
    { firstName: 'Joan', lastName: 'Wurzel', jerseyNumber: 24 }
  ],
  games: [
    { date: '2025-04-22', opponent: 'Game 1 Opponent' },
    { date: '2025-04-29', opponent: 'Game 2 Opponent' },
    { date: '2025-05-12', opponent: 'Game 3 Opponent' },
    { date: '2025-05-21', opponent: 'Game 4 Opponent' },
    { date: '2025-06-04', opponent: 'Game 5 Opponent' },
    { date: '2025-06-11', opponent: 'Game 6 Opponent' },
    { date: '2025-06-27', opponent: 'Game 7 Opponent' },
    { date: '2025-07-16', opponent: 'Game 8 Opponent' },
    { date: '2025-08-07', opponent: 'Game 9 Opponent' }
  ]
};

async function createTablesIfNotExist() {
  await db.execute(sql`
    CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'manager', 'coach', 'player');
    CREATE TYPE IF NOT EXISTS game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
    CREATE TYPE IF NOT EXISTS home_away AS ENUM ('home', 'away');
    
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role user_role NOT NULL DEFAULT 'player',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS seasons (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      year INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      jersey_number INTEGER,
      primary_position VARCHAR(10),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS games (
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
    );
    
    CREATE TABLE IF NOT EXISTS player_game_stats (
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
    );
    
    CREATE TABLE IF NOT EXISTS scoring_book_images (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id),
      image_url VARCHAR(500) NOT NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏟️ Starting Underhand Jobs team data setup...');
    
    // First, ensure database tables exist
    console.log('🔧 Ensuring database tables exist...');
    await createTablesIfNotExist();
    console.log('✅ Database tables ready');
    
    // Security check: Only allow setup if no users exist
    const existingUsers = await db.query.users.findFirst();
    if (existingUsers) {
      console.log('❌ Database already initialized');
      return NextResponse.json(
        { error: 'Database already initialized' },
        { status: 400 }
      );
    }

    console.log('✅ Database not initialized, proceeding...');

    // Step 1: Create admin and manager users
    console.log('👤 Creating user accounts...');
    const adminPasswordHash = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@teamstats.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }).returning();

    const managerPasswordHash = await hashPassword('manager123');
    const [managerUser] = await db.insert(users).values({
      email: 'manager@teamstats.com',
      passwordHash: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: 'manager',
    }).returning();

    console.log('✅ Created user accounts');

    // Step 2: Create current season
    const currentYear = new Date().getFullYear();
    const [season] = await db.insert(seasons).values({
      name: `2025 Spring/Summer Season`,
      year: 2025,
      startDate: new Date(`2025-04-01`),
      endDate: new Date(`2025-08-31`),
      isActive: true,
    }).returning();

    console.log('✅ Created season');

    // Step 3: Create players
    console.log('⚾ Creating players...');
    const createdPlayers = [];
    for (const playerData of TEAM_DATA.players) {
      const [player] = await db.insert(players).values({
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        jerseyNumber: playerData.jerseyNumber,
        primaryPosition: undefined,
      }).returning();
      createdPlayers.push(player);
    }

    console.log(`✅ Created ${createdPlayers.length} players`);

    // Step 4: Create games
    console.log('🎮 Creating games...');
    const createdGames = [];
    for (const gameData of TEAM_DATA.games) {
      const [game] = await db.insert(games).values({
        seasonId: season.id,
        gameDate: new Date(gameData.date),
        opponent: gameData.opponent,
        homeAway: 'home',
        ourScore: undefined,
        theirScore: undefined,
        location: undefined,
        status: 'completed',
      }).returning();
      createdGames.push(game);
    }

    console.log(`✅ Created ${createdGames.length} games`);

    return NextResponse.json({
      success: true,
      message: 'Underhand Jobs team data imported successfully!',
      summary: {
        players: createdPlayers.length,
        games: createdGames.length,
        stats: 0, // We'll add stats in a future update
      },
      credentials: {
        admin: { email: 'admin@teamstats.com', password: 'admin123' },
        manager: { email: 'manager@teamstats.com', password: 'manager123' }
      }
    });

  } catch (error) {
    console.error('❌ Team data import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Team data import failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}