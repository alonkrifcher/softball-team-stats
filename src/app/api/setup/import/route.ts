import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db, users, seasons, players, games, playerGameStats } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

interface PlayerRow {
  'Player Name': string;
  'Jersey #': number;
  'Position': string;
  'Games'?: number;
  'AB': number;
  'H': number;
  'R': number;
  'RBI': number;
  'BB': number;
  'K': number;
  '1B': number;
  '2B': number;
  '3B': number;
  'HR': number;
  'SB': number;
  'E': number;
  'A': number;
  'PO': number;
  'Order'?: number; // For individual games
}

interface GameInfoRow {
  'Date': string;
  'Opponent': string;
  'Home/Away': string;
  'Our Score'?: number;
  'Their Score'?: number;
  'Location'?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security check: Only allow setup if no users exist
    const existingUsers = await db.query.users.findFirst();
    if (existingUsers) {
      return NextResponse.json(
        { error: 'Database already initialized' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('Processing Excel file:', file.name);
    
    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    
    console.log('Sheet names:', workbook.SheetNames);

    // Step 1: Create admin and manager users
    const adminPasswordHash = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@teamstats.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }).returning();

    const managerPasswordHash = await hashPassword('manager123');
    const [managerUser] = await db.insert(users).values({
      email: 'manager@teamstats.com',
      passwordHash: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: 'manager',
    }).returning();

    console.log('✅ Created user accounts');

    // Step 2: Create current season
    const currentYear = new Date().getFullYear();
    const [season] = await db.insert(seasons).values({
      name: `${currentYear} Season`,
      year: currentYear,
      startDate: new Date(`${currentYear}-03-01`),
      endDate: new Date(`${currentYear}-08-31`),
      isActive: true,
    }).returning();

    console.log('✅ Created season');

    // Step 3: Process Season Totals sheet to create players
    let playersData: PlayerRow[] = [];
    const seasonTotalsSheet = workbook.Sheets['Season_Totals'] || workbook.Sheets['Totals'] || workbook.Sheets[workbook.SheetNames[0]];
    
    if (seasonTotalsSheet) {
      playersData = XLSX.utils.sheet_to_json<PlayerRow>(seasonTotalsSheet);
      console.log('Found players data:', playersData.length);

      for (const playerRow of playersData) {
        const nameParts = playerRow['Player Name'].trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;
        
        await db.insert(players).values({
          firstName,
          lastName,
          jerseyNumber: playerRow['Jersey #'] || undefined,
          primaryPosition: playerRow['Position'] || undefined,
        });
      }
      console.log('✅ Created players');
    }

    // Step 4: Process Games sheet (if exists)
    let gamesList: GameInfoRow[] = [];
    const gamesSheet = workbook.Sheets['Games'] || workbook.Sheets['Schedule'];
    if (gamesSheet) {
      gamesList = XLSX.utils.sheet_to_json<GameInfoRow>(gamesSheet);
      console.log('Found games data:', gamesList.length);
    }

    // Step 5: Process individual game sheets
    let gamesCreated = 0;
    let statsCreated = 0;

    for (const sheetName of workbook.SheetNames) {
      // Skip non-game sheets
      if (['Season_Totals', 'Totals', 'Games', 'Schedule'].includes(sheetName)) {
        continue;
      }

      // Assume game sheets are named like "Game_2024-03-15_Thunder-Bolts" or similar
      if (sheetName.toLowerCase().includes('game') || sheetName.match(/\d{4}-\d{2}-\d{2}/)) {
        console.log('Processing game sheet:', sheetName);
        
        const gameSheet = workbook.Sheets[sheetName];
        const gameStats = XLSX.utils.sheet_to_json<PlayerRow>(gameSheet);
        
        // Try to extract game info from sheet name or use from Games sheet
        let gameDate: Date;
        let opponent: string;
        let homeAway: 'home' | 'away' = 'home';
        
        // Extract date from sheet name (format: Game_2024-03-15_Opponent)
        const dateMatch = sheetName.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          gameDate = new Date(dateMatch[1]);
          const parts = sheetName.split('_');
          opponent = parts[parts.length - 1].replace(/-/g, ' ');
        } else {
          // Use current date as fallback
          gameDate = new Date();
          opponent = 'Unknown Opponent';
        }

        // Find matching game info from Games sheet
        const gameInfo = gamesList.find(g => 
          new Date(g.Date).toDateString() === gameDate.toDateString()
        );
        
        if (gameInfo) {
          opponent = gameInfo.Opponent;
          homeAway = gameInfo['Home/Away'].toLowerCase() === 'away' ? 'away' : 'home';
        }

        // Create the game
        const [newGame] = await db.insert(games).values({
          seasonId: season.id,
          gameDate,
          opponent,
          homeAway,
          ourScore: gameInfo?.['Our Score'] || undefined,
          theirScore: gameInfo?.['Their Score'] || undefined,
          location: gameInfo?.Location || undefined,
          status: 'completed',
        }).returning();

        gamesCreated++;

        // Add player stats for this game
        const allPlayers = await db.query.players.findMany();
        
        for (const statRow of gameStats) {
          // Find matching player
          const playerName = statRow['Player Name'].trim();
          const player = allPlayers.find(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase() === playerName.toLowerCase()
          );
          
          if (player) {
            await db.insert(playerGameStats).values({
              playerId: player.id,
              gameId: newGame.id,
              battingOrder: statRow.Order || undefined,
              atBats: statRow.AB || 0,
              hits: statRow.H || 0,
              runs: statRow.R || 0,
              rbis: statRow.RBI || 0,
              walks: statRow.BB || 0,
              strikeouts: statRow.K || 0,
              singles: statRow['1B'] || 0,
              doubles: statRow['2B'] || 0,
              triples: statRow['3B'] || 0,
              homeRuns: statRow.HR || 0,
              stolenBases: statRow.SB || 0,
              errors: statRow.E || 0,
              assists: statRow.A || 0,
              putouts: statRow.PO || 0,
              fieldingPosition: player.primaryPosition,
            });
            statsCreated++;
          }
        }
        
        console.log(`✅ Created game: ${opponent} with ${gameStats.length} player stats`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Excel data imported successfully!',
      summary: {
        players: playersData.length,
        games: gamesCreated,
        stats: statsCreated,
      },
      credentials: {
        admin: { email: 'admin@teamstats.com', password: 'admin123' },
        manager: { email: 'manager@teamstats.com', password: 'manager123' }
      }
    });

  } catch (error) {
    console.error('❌ Excel import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Excel import failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}