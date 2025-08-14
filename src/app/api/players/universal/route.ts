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
      SELECT DISTINCT
        ROW_NUMBER() OVER (ORDER BY player_name) + 10000 as id,
        SPLIT_PART(player_name, ' ', 1) as "firstName",
        CASE 
          WHEN LENGTH(player_name) - LENGTH(REPLACE(player_name, ' ', '')) > 0
          THEN TRIM(SUBSTRING(player_name FROM POSITION(' ' IN player_name)))
          ELSE ''
        END as "lastName",
        NULL as "jerseyNumber",
        STRING_AGG(DISTINCT position, '/') as "primaryPosition",
        true as "isActive",
        'historical' as source
      FROM historical_player_game_stats
      WHERE player_name IS NOT NULL AND player_name != ''
      GROUP BY player_name
      ORDER BY player_name ASC
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