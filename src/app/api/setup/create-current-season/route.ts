import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🏟️ Setting up current season for new game creation...');
    
    // Create 2025 season in the regular seasons table for current stats
    await db.execute(sql`
      INSERT INTO seasons (name, year, start_date, end_date, is_active, created_at)
      VALUES ('Spring/Summer 2025', 2025, '2025-04-01', '2025-09-30', true, NOW())
      ON CONFLICT DO NOTHING
    `);
    
    // Also create a 2026 season for future use
    await db.execute(sql`
      INSERT INTO seasons (name, year, start_date, end_date, is_active, created_at)
      VALUES ('Spring/Summer 2026', 2026, '2026-04-01', '2026-09-30', false, NOW())
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Created current seasons');
    
    return NextResponse.json({
      success: true,
      message: 'Current seasons created successfully! You can now create new games.'
    });

  } catch (error) {
    console.error('❌ Create current season error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create current season', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}