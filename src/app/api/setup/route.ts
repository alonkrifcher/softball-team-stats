import { NextRequest, NextResponse } from 'next/server';
import { db, users, seasons, players } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sql } from 'drizzle-orm';

async function createTablesIfNotExist() {
  // Create the database tables using raw SQL
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
      status game_status NOT NULL DEFAULT 'scheduled',
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
    // First, ensure database tables exist
    console.log('🔧 Ensuring database tables exist...');
    await createTablesIfNotExist();
    console.log('✅ Database tables ready');
    
    // Security check: Only allow setup if no users exist
    const existingUsers = await db.query.users.findFirst();
    if (existingUsers) {
      return NextResponse.json(
        { error: 'Database already initialized' },
        { status: 400 }
      );
    }

    console.log('Starting database setup...');

    // Create admin user
    const adminPasswordHash = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@teamstats.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }).returning();

    console.log('✅ Created admin user');

    // Create manager user
    const managerPasswordHash = await hashPassword('manager123');
    const [managerUser] = await db.insert(users).values({
      email: 'manager@teamstats.com',
      passwordHash: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: 'manager',
    }).returning();

    console.log('✅ Created manager user');

    // Create current season
    const currentYear = new Date().getFullYear();
    const [season] = await db.insert(seasons).values({
      name: `Spring Season`,
      year: currentYear,
      startDate: new Date(`${currentYear}-03-01`),
      endDate: new Date(`${currentYear}-08-31`),
      isActive: true,
    }).returning();

    console.log('✅ Created current season');

    // Create sample players
    const samplePlayers = [
      { firstName: 'Mike', lastName: 'Johnson', jerseyNumber: 12, primaryPosition: 'P' },
      { firstName: 'Sarah', lastName: 'Williams', jerseyNumber: 7, primaryPosition: 'SS' },
      { firstName: 'Tom', lastName: 'Davis', jerseyNumber: 23, primaryPosition: 'C' },
      { firstName: 'Lisa', lastName: 'Brown', jerseyNumber: 15, primaryPosition: '1B' },
      { firstName: 'Jake', lastName: 'Miller', jerseyNumber: 9, primaryPosition: 'CF' },
      { firstName: 'Emma', lastName: 'Wilson', jerseyNumber: 3, primaryPosition: '2B' },
      { firstName: 'Chris', lastName: 'Garcia', jerseyNumber: 18, primaryPosition: 'LF' },
      { firstName: 'Amy', lastName: 'Martinez', jerseyNumber: 21, primaryPosition: 'RF' },
      { firstName: 'Ryan', lastName: 'Anderson', jerseyNumber: 5, primaryPosition: '3B' },
      { firstName: 'Jessica', lastName: 'Taylor', jerseyNumber: 11, primaryPosition: 'DH' },
    ];

    for (const player of samplePlayers) {
      await db.insert(players).values(player);
    }

    console.log('✅ Created 10 sample players');

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      credentials: {
        admin: { email: 'admin@teamstats.com', password: 'admin123' },
        manager: { email: 'manager@teamstats.com', password: 'manager123' }
      }
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    
    // Return detailed error info for debugging
    return NextResponse.json(
      { 
        error: 'Database setup failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}