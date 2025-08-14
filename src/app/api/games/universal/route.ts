import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seasonId, gameDate, opponent, homeAway, location, notes } = body;

    console.log('🎮 Creating universal game for season:', seasonId);
    
    // First, determine if this is a current or historical season
    let isHistoricalSeason = false;
    let seasonInfo = null;

    // Check current seasons first
    const currentSeasonCheck = await db.execute(sql`
      SELECT id, name, year FROM seasons WHERE id = ${seasonId}
    `);

    if (currentSeasonCheck.length > 0) {
      seasonInfo = currentSeasonCheck[0];
      console.log('📅 Found current season:', seasonInfo.name);
    } else {
      // Check historical seasons
      const historicalSeasonCheck = await db.execute(sql`
        SELECT year as id, 
               CASE 
                 WHEN year = 2018 THEN 'Spring/Summer 2018'
                 WHEN year = 2019 THEN 'Spring/Summer 2019' 
                 WHEN year = 2021 THEN 'Spring/Summer 2021'
                 WHEN year = 2022 THEN 'Spring/Summer 2022'
                 WHEN year = 2023 THEN 'Spring/Summer 2023'
                 WHEN year = 2024 THEN 'Spring/Summer 2024'
                 WHEN year = 2025 THEN 'Spring/Summer 2025'
                 ELSE CONCAT('Season ', year)
               END as name, 
               year 
        FROM historical_seasons 
        WHERE year = ${seasonId}
      `);

      if (historicalSeasonCheck.length > 0) {
        isHistoricalSeason = true;
        seasonInfo = historicalSeasonCheck[0];
        console.log('📜 Found historical season:', seasonInfo.name);
      } else {
        return NextResponse.json(
          { error: 'Season not found' },
          { status: 404 }
        );
      }
    }

    // Create game in appropriate system
    let gameResult;

    if (isHistoricalSeason) {
      // Create in historical system
      console.log('🏛️ Creating game in historical system...');
      
      // Get next game ID for historical system
      const maxGameIdResult = await db.execute(sql`
        SELECT COALESCE(MAX(game_id), 0) as max_id FROM historical_games
      `);
      const nextGameId = Number(maxGameIdResult[0]?.max_id || 0) + 1;

      // Insert into historical_games (using season_year not season_id)
      await db.execute(sql`
        INSERT INTO historical_games (
          game_id, 
          season_year, 
          game_number, 
          game_date, 
          opponent, 
          result, 
          uhj_runs, 
          opp_runs
        )
        VALUES (
          ${nextGameId},
          ${seasonId},
          ${nextGameId}, 
          ${gameDate},
          ${opponent},
          'TBD',
          NULL,
          NULL
        )
      `);

      gameResult = {
        id: nextGameId,
        seasonId: seasonId,
        gameDate: gameDate,
        opponent: opponent,
        homeAway: homeAway,
        location: location,
        notes: notes,
        status: 'scheduled',
        ourScore: null,
        theirScore: null,
        system: 'historical'
      };

      console.log(`✅ Created historical game ID: ${nextGameId}`);

    } else {
      // Create in current system
      console.log('🆕 Creating game in current system...');
      
      const result = await db.execute(sql`
        INSERT INTO games (
          season_id,
          game_date,
          opponent,
          home_away,
          location,
          notes,
          status,
          created_at,
          updated_at
        )
        VALUES (
          ${seasonId},
          ${gameDate},
          ${opponent},
          ${homeAway},
          ${location || null},
          ${notes || null},
          'scheduled',
          NOW(),
          NOW()
        )
        RETURNING id, season_id, game_date, opponent, home_away, location, notes, status, our_score, their_score
      `);

      if (result.length === 0) {
        throw new Error('Failed to create game in current system');
      }

      const newGame = result[0];
      gameResult = {
        id: newGame.id,
        seasonId: newGame.season_id,
        gameDate: newGame.game_date,
        opponent: newGame.opponent,
        homeAway: newGame.home_away,
        location: newGame.location,
        notes: newGame.notes,
        status: newGame.status,
        ourScore: newGame.our_score,
        theirScore: newGame.their_score,
        system: 'current'
      };

      console.log(`✅ Created current game ID: ${newGame.id}`);
    }

    return NextResponse.json({
      success: true,
      game: gameResult,
      message: `Game created successfully in ${isHistoricalSeason ? 'historical' : 'current'} season: ${seasonInfo.name}`
    });

  } catch (error) {
    console.error('❌ Universal game creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create game', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}