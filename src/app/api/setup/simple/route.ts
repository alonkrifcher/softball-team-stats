import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting ultra-simple database setup...');
    
    // Drop and recreate everything cleanly
    await db.execute(sql`
      DROP TABLE IF EXISTS player_game_stats CASCADE;
      DROP TABLE IF EXISTS scoring_book_images CASCADE;
      DROP TABLE IF EXISTS games CASCADE;
      DROP TABLE IF EXISTS players CASCADE;
      DROP TABLE IF EXISTS seasons CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS game_status CASCADE;
      DROP TYPE IF EXISTS home_away CASCADE;
    `);
    
    console.log('✅ Cleaned up existing tables');

    // Create simple tables without complex types
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'player',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE seasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        jersey_number INTEGER,
        primary_position VARCHAR(10),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE games (
        id SERIAL PRIMARY KEY,
        season_id INTEGER NOT NULL REFERENCES seasons(id),
        game_date DATE NOT NULL,
        opponent VARCHAR(100) NOT NULL,
        home_away VARCHAR(10) NOT NULL,
        our_score INTEGER,
        their_score INTEGER,
        location VARCHAR(200),
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE player_game_stats (
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
    `);

    console.log('✅ Created tables');

    // Create admin and manager users with simple passwords
    const adminPasswordHash = await hashPassword('password');
    const managerPasswordHash = await hashPassword('password');
    
    await db.execute(sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
        ('admin@teamstats.com', ${adminPasswordHash}, 'Admin', 'User', 'admin'),
        ('manager@teamstats.com', ${managerPasswordHash}, 'Team', 'Manager', 'manager');
    `);

    console.log('✅ Created users');

    // Create 2025 season
    await db.execute(sql`
      INSERT INTO seasons (name, year, start_date, end_date, is_active) VALUES
        ('2025 Spring/Summer Season', 2025, '2025-04-01', '2025-08-31', true);
    `);

    console.log('✅ Created season');

    // Insert all Underhand Jobs players
    const players = [
      'Chloe Amarilla', 'Alyssa Andrews', 'Lara Horwitz', 'Miranda Kahn', 'Rebecca Klapper',
      'Amy Koenig', 'Dahlia Krueger', 'Zoe Lichtenbaum', 'Cynthia Liu', 'Rachel Maleh',
      'Leah Mendelson', 'Shannon Murphy', 'Lindsay Napoli', 'Cady Peckman', 'Lisa Piacentini',
      'Donna Raftery', 'Kira Salko', 'Sabrina Schnurman', 'Sarah Shandera', 'Julie Stein',
      'Lynn Urdaneta', 'Sarah Weinstein', 'Cheryl Wieselman', 'Joan Wurzel'
    ];

    for (let i = 0; i < players.length; i++) {
      const [firstName, ...lastNameParts] = players[i].split(' ');
      const lastName = lastNameParts.join(' ');
      
      await db.execute(sql`
        INSERT INTO players (first_name, last_name, jersey_number) VALUES
          (${firstName}, ${lastName}, ${i + 1});
      `);
    }

    console.log(`✅ Created ${players.length} players`);

    // Insert games
    const games = [
      ['2025-04-22', 'Game 1 Opponent'],
      ['2025-04-29', 'Game 2 Opponent'],
      ['2025-05-12', 'Game 3 Opponent'],
      ['2025-05-21', 'Game 4 Opponent'],
      ['2025-06-04', 'Game 5 Opponent'],
      ['2025-06-11', 'Game 6 Opponent'],
      ['2025-06-27', 'Game 7 Opponent'],
      ['2025-07-16', 'Game 8 Opponent'],
      ['2025-08-07', 'Game 9 Opponent']
    ];

    for (const [date, opponent] of games) {
      await db.execute(sql`
        INSERT INTO games (season_id, game_date, opponent, home_away, status) VALUES
          (1, ${date}, ${opponent}, 'home', 'completed');
      `);
    }

    console.log(`✅ Created ${games.length} games`);

    return NextResponse.json({
      success: true,
      message: 'Ultra-simple setup completed successfully!',
      summary: {
        players: players.length,
        games: games.length,
        stats: 0,
      },
      credentials: {
        admin: { email: 'admin@teamstats.com', password: 'password' },
        manager: { email: 'manager@teamstats.com', password: 'password' }
      }
    });

  } catch (error) {
    console.error('❌ Simple setup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Simple setup failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}