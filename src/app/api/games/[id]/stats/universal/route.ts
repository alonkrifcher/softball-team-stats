import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);
    const body = await request.json();
    const { playerStats, gameScore } = body;

    console.log('📊 Saving universal stats for game:', gameId);
    
    // First, determine if this is a current or historical game
    let isHistoricalGame = false;
    let gameInfo = null;

    // Check current games first
    const currentGameCheck = await db.execute(sql`
      SELECT id, season_id, opponent, status FROM games WHERE id = ${gameId}
    `);

    if (currentGameCheck.length > 0) {
      gameInfo = currentGameCheck[0];
      console.log('🆕 Found current game:', gameInfo.opponent);
    } else {
      // Check historical games
      const historicalGameCheck = await db.execute(sql`
        SELECT game_id as id, season_id, opponent, result 
        FROM historical_games 
        WHERE game_id = ${gameId}
      `);

      if (historicalGameCheck.length > 0) {
        isHistoricalGame = true;
        gameInfo = historicalGameCheck[0];
        console.log('🏛️ Found historical game:', gameInfo.opponent);
      } else {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }
    }

    // Save stats to appropriate system
    if (isHistoricalGame) {
      console.log('💾 Saving stats to historical system...');
      
      // Delete existing historical player stats for this game
      await db.execute(sql`
        DELETE FROM historical_player_game_stats 
        WHERE game_id = ${gameId}
      `);

      // Insert new historical player stats
      for (const playerStat of playerStats) {
        // For historical players, we need to use the player name instead of ID
        const player = await getPlayerInfo(playerStat.playerId, isHistoricalGame);
        const playerName = player ? player.name : `Unknown Player ${playerStat.playerId}`;

        await db.execute(sql`
          INSERT INTO historical_player_game_stats (
            game_id,
            player_name,
            batting_order,
            at_bats,
            hits,
            runs,
            rbis,
            walks,
            strikeouts,
            doubles,
            triples,
            home_runs,
            stolen_bases,
            position,
            avg,
            obp,
            slg,
            ops
          ) VALUES (
            ${gameId},
            ${playerName},
            ${playerStat.battingOrder || null},
            ${playerStat.atBats || 0},
            ${playerStat.hits || 0},
            ${playerStat.runs || 0},
            ${playerStat.rbis || 0},
            ${playerStat.walks || 0},
            ${playerStat.strikeouts || 0},
            ${playerStat.doubles || 0},
            ${playerStat.triples || 0},
            ${playerStat.homeRuns || 0},
            ${playerStat.stolenBases || 0},
            ${playerStat.fieldingPosition || null},
            ${(playerStat.atBats > 0 ? playerStat.hits / playerStat.atBats : 0).toFixed(3)},
            ${((playerStat.hits + playerStat.walks) / Math.max(playerStat.atBats + playerStat.walks, 1)).toFixed(3)},
            ${((playerStat.singles + playerStat.doubles * 2 + playerStat.triples * 3 + playerStat.homeRuns * 4) / Math.max(playerStat.atBats, 1)).toFixed(3)},
            0.000
          )
        `);
      }

      // Update game score if provided
      if (gameScore && (gameScore.ourScore !== undefined || gameScore.theirScore !== undefined)) {
        const result = gameScore.ourScore > gameScore.theirScore ? 'W' : 
                      gameScore.ourScore < gameScore.theirScore ? 'L' : 'T';
        
        await db.execute(sql`
          UPDATE historical_games 
          SET our_score = ${gameScore.ourScore || null}, 
              their_score = ${gameScore.theirScore || null},
              result = ${result}
          WHERE game_id = ${gameId}
        `);
      }

      console.log(`✅ Saved ${playerStats.length} historical player stats`);

    } else {
      console.log('💾 Saving stats to current system...');
      
      // Delete existing player stats for this game
      await db.execute(sql`
        DELETE FROM player_game_stats WHERE game_id = ${gameId}
      `);

      // Insert new player stats
      for (const playerStat of playerStats) {
        await db.execute(sql`
          INSERT INTO player_game_stats (
            player_id,
            game_id,
            batting_order,
            at_bats,
            hits,
            runs,
            rbis,
            walks,
            strikeouts,
            singles,
            doubles,
            triples,
            home_runs,
            stolen_bases,
            fielding_position,
            errors,
            assists,
            putouts,
            created_at,
            updated_at
          ) VALUES (
            ${playerStat.playerId},
            ${gameId},
            ${playerStat.battingOrder || null},
            ${playerStat.atBats || 0},
            ${playerStat.hits || 0},
            ${playerStat.runs || 0},
            ${playerStat.rbis || 0},
            ${playerStat.walks || 0},
            ${playerStat.strikeouts || 0},
            ${playerStat.singles || 0},
            ${playerStat.doubles || 0},
            ${playerStat.triples || 0},
            ${playerStat.homeRuns || 0},
            ${playerStat.stolenBases || 0},
            ${playerStat.fieldingPosition || null},
            ${playerStat.errors || 0},
            ${playerStat.assists || 0},
            ${playerStat.putouts || 0},
            NOW(),
            NOW()
          )
        `);
      }

      // Update game score and status
      if (gameScore && (gameScore.ourScore !== undefined || gameScore.theirScore !== undefined)) {
        await db.execute(sql`
          UPDATE games 
          SET our_score = ${gameScore.ourScore || null}, 
              their_score = ${gameScore.theirScore || null},
              status = 'completed',
              updated_at = NOW()
          WHERE id = ${gameId}
        `);
      }

      console.log(`✅ Saved ${playerStats.length} current player stats`);
    }

    return NextResponse.json({
      success: true,
      message: `Stats saved successfully to ${isHistoricalGame ? 'historical' : 'current'} system`,
      gameId: gameId,
      playersUpdated: playerStats.length
    });

  } catch (error) {
    console.error('❌ Universal stats save error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save stats', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to get player information
async function getPlayerInfo(playerId: number, isHistoricalGame: boolean) {
  try {
    if (isHistoricalGame) {
      // For historical games, extract name from our universal players data
      const result = await db.execute(sql`
        SELECT DISTINCT player_name as name
        FROM historical_player_game_stats
        WHERE ROW_NUMBER() OVER (ORDER BY player_name) + 10000 = ${playerId}
        LIMIT 1
      `);
      return result.length > 0 ? { name: result[0].name } : null;
    } else {
      // For current games, get from players table
      const result = await db.execute(sql`
        SELECT first_name, last_name
        FROM players
        WHERE id = ${playerId}
      `);
      return result.length > 0 ? 
        { name: `${result[0].first_name} ${result[0].last_name}` } : 
        null;
    }
  } catch (error) {
    console.error('Error getting player info:', error);
    return null;
  }
}