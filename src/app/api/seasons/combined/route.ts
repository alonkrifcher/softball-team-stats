import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🗓️ Fetching combined seasons (current + historical)...');
    
    // Get current seasons from the regular seasons table
    const currentSeasonsData = await db.execute(sql`
      SELECT 
        id,
        name,
        year,
        start_date as "startDate",
        end_date as "endDate",
        is_active as "isActive",
        created_at as "createdAt",
        'current' as source
      FROM seasons
      ORDER BY year DESC, name ASC
    `);

    // Get historical seasons
    const historicalSeasonsData = await db.execute(sql`
      SELECT 
        season_id as id,
        season_name as name,
        year,
        NULL as "startDate",
        NULL as "endDate",
        false as "isActive",
        NULL as "createdAt",
        'historical' as source
      FROM historical_seasons
      ORDER BY year DESC, season_name ASC
    `);

    // Combine and format seasons
    const currentSeasons = currentSeasonsData.map(row => ({
      id: row.id,
      name: row.name,
      year: row.year,
      startDate: row.startDate ? new Date(row.startDate).toISOString() : null,
      endDate: row.endDate ? new Date(row.endDate).toISOString() : null,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      source: 'current' as const,
      type: 'current' as const
    }));

    const historicalSeasons = historicalSeasonsData.map(row => ({
      id: row.id,
      name: row.name,
      year: row.year,
      startDate: null,
      endDate: null,
      isActive: false,
      createdAt: null,
      source: 'historical' as const,
      type: 'historical' as const
    }));

    // Combine all seasons and sort by year (desc) then name
    const allSeasons = [...currentSeasons, ...historicalSeasons]
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return a.name.localeCompare(b.name);
      });

    console.log(`✅ Found ${currentSeasons.length} current seasons and ${historicalSeasons.length} historical seasons`);
    
    return NextResponse.json({
      success: true,
      seasons: allSeasons,
      totalSeasons: allSeasons.length,
      currentSeasons: currentSeasons.length,
      historicalSeasons: historicalSeasons.length
    });

  } catch (error) {
    console.error('❌ Combined seasons fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch combined seasons', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}