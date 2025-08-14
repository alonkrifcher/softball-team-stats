import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('👥 Fetching universal players (current + historical)...');
    
    // Get current players from the players table
    const currentPlayersData = await db.execute(sql`
      SELECT 
        id,
        first_name as "firstName",
        last_name as "lastName", 
        jersey_number as "jerseyNumber",
        primary_position as "primaryPosition",
        is_active as "isActive",
        'current' as source
      FROM players
      WHERE is_active = true
      ORDER BY first_name ASC, last_name ASC
    `);

    // Get historical players from our roster system
    const historicalPlayersData = await db.execute(sql`
      SELECT 
        hp.id + 10000 as id,
        SPLIT_PART(hp.name, ' ', 1) as "firstName",
        CASE 
          WHEN LENGTH(hp.name) - LENGTH(REPLACE(hp.name, ' ', '')) > 0
          THEN TRIM(SUBSTRING(hp.name FROM POSITION(' ' IN hp.name)))
          ELSE ''
        END as "lastName",
        NULL as "jerseyNumber",
        'Various' as "primaryPosition",
        true as "isActive",
        'historical' as source,
        hp.name
      FROM historical_players hp
      WHERE hp.name IS NOT NULL AND hp.name != ''
      ORDER BY hp.name ASC
    `);

    // Format current players
    const currentPlayers = currentPlayersData.map(row => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      jerseyNumber: row.jerseyNumber,
      primaryPosition: row.primaryPosition,
      isActive: Boolean(row.isActive),
      source: 'current' as const,
      displayName: `${row.firstName} ${row.lastName}`.trim(),
      fullName: `${row.firstName} ${row.lastName}`.trim()
    }));

    // Format historical players
    const historicalPlayers = historicalPlayersData.map(row => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName || '',
      jerseyNumber: row.jerseyNumber,
      primaryPosition: row.primaryPosition || 'Unknown',
      isActive: Boolean(row.isActive),
      source: 'historical' as const,
      displayName: `${row.firstName} ${row.lastName || ''}`.trim(),
      fullName: `${row.firstName} ${row.lastName || ''}`.trim()
    }));

    // Combine and remove duplicates based on name similarity
    const allPlayers = [...currentPlayers, ...historicalPlayers];
    
    // Sort by name
    allPlayers.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    console.log(`✅ Found ${currentPlayers.length} current players and ${historicalPlayers.length} historical players`);
    
    return NextResponse.json({
      success: true,
      players: allPlayers,
      totalPlayers: allPlayers.length,
      currentPlayers: currentPlayers.length,
      historicalPlayers: historicalPlayers.length
    });

  } catch (error) {
    console.error('❌ Universal players fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch universal players', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}