import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting fresh database reset...');
    
    // Drop all historical tables in correct order (respecting foreign keys)
    await db.execute(sql`
      DROP TABLE IF EXISTS historical_player_games CASCADE;
      DROP TABLE IF EXISTS historical_games CASCADE;
      DROP TABLE IF EXISTS historical_seasons CASCADE;
      DROP TABLE IF EXISTS historical_players CASCADE;
    `);
    
    console.log('✅ Dropped all historical tables');
    
    // Create fresh historical tables with better structure
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
        avg DECIMAL(5,3),
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
        slg DECIMAL(5,3),
        obp DECIMAL(5,3),
        ops DECIMAL(5,3),
        eqa DECIMAL(5,3),
        on_base_numerator INTEGER NOT NULL DEFAULT 0,
        on_base_denominator INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(game_id, player_id)
      );
    `);

    console.log('✅ Created fresh historical tables');
    
    return NextResponse.json({
      success: true,
      message: 'Database reset successfully - ready for fresh CSV import'
    });

  } catch (error) {
    console.error('❌ Database reset error:', error);
    
    return NextResponse.json(
      { 
        error: 'Database reset failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}