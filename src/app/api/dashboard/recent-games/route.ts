import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getAuthUser, createAuthError } from '@/lib/auth/simple';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    // Get the 5 most recent completed games
    const recentGamesResult = await db.execute(sql`
      SELECT 
        g.id,
        g.game_date,
        g.opponent,
        g.home_away,
        g.our_score,
        g.their_score,
        g.status
      FROM games g
      WHERE g.status = 'completed'
      ORDER BY g.game_date DESC
      LIMIT 5
    `);

    const recentGames = recentGamesResult.map(game => {
      const ourScore = game.our_score || 0;
      const theirScore = game.their_score || 0;
      const result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'T';
      
      return {
        id: game.id,
        gameDate: game.game_date,
        opponent: game.opponent,
        homeAway: game.home_away,
        ourScore,
        theirScore,
        result,
        resultDisplay: `${result} ${ourScore}-${theirScore}`
      };
    });

    return NextResponse.json({ recentGames });

  } catch (error) {
    console.error('Recent games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}