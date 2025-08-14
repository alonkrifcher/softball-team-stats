import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check what tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'historical_%'
      ORDER BY table_name
    `);

    console.log('📋 Historical tables found:', tables);

    // Check data counts in each table
    const results: any = {
      tables: tables.map((t: any) => t.table_name),
      data: {}
    };

    for (const table of tables) {
      const tableName = (table as any).table_name;
      try {
        const count = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        results.data[tableName] = (count[0] as any).count;
      } catch (error) {
        results.data[tableName] = `Error: ${error}`;
      }
    }

    // Also check for sample data
    if (results.tables.includes('historical_seasons')) {
      const seasonSample = await db.execute(sql`SELECT * FROM historical_seasons LIMIT 3`);
      results.seasonSample = seasonSample;
    }

    if (results.tables.includes('historical_players')) {
      const playerSample = await db.execute(sql`SELECT * FROM historical_players LIMIT 3`);
      results.playerSample = playerSample;
    }

    if (results.tables.includes('historical_games')) {
      const gameSample = await db.execute(sql`SELECT * FROM historical_games LIMIT 3`);
      results.gameSample = gameSample;
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check tables',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}