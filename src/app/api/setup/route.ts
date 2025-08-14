import { NextRequest, NextResponse } from 'next/server';
import { db, users, seasons, players } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

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

    console.log('Starting database setup...');

    // Create admin user
    const adminPasswordHash = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@teamstats.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }).returning();

    console.log('✅ Created admin user');

    // Create manager user
    const managerPasswordHash = await hashPassword('manager123');
    const [managerUser] = await db.insert(users).values({
      email: 'manager@teamstats.com',
      passwordHash: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: 'manager',
    }).returning();

    console.log('✅ Created manager user');

    // Create current season
    const currentYear = new Date().getFullYear();
    const [season] = await db.insert(seasons).values({
      name: `Spring Season`,
      year: currentYear,
      startDate: new Date(`${currentYear}-03-01`),
      endDate: new Date(`${currentYear}-08-31`),
      isActive: true,
    }).returning();

    console.log('✅ Created current season');

    // Create sample players
    const samplePlayers = [
      { firstName: 'Mike', lastName: 'Johnson', jerseyNumber: 12, primaryPosition: 'P' },
      { firstName: 'Sarah', lastName: 'Williams', jerseyNumber: 7, primaryPosition: 'SS' },
      { firstName: 'Tom', lastName: 'Davis', jerseyNumber: 23, primaryPosition: 'C' },
      { firstName: 'Lisa', lastName: 'Brown', jerseyNumber: 15, primaryPosition: '1B' },
      { firstName: 'Jake', lastName: 'Miller', jerseyNumber: 9, primaryPosition: 'CF' },
      { firstName: 'Emma', lastName: 'Wilson', jerseyNumber: 3, primaryPosition: '2B' },
      { firstName: 'Chris', lastName: 'Garcia', jerseyNumber: 18, primaryPosition: 'LF' },
      { firstName: 'Amy', lastName: 'Martinez', jerseyNumber: 21, primaryPosition: 'RF' },
      { firstName: 'Ryan', lastName: 'Anderson', jerseyNumber: 5, primaryPosition: '3B' },
      { firstName: 'Jessica', lastName: 'Taylor', jerseyNumber: 11, primaryPosition: 'DH' },
    ];

    for (const player of samplePlayers) {
      await db.insert(players).values(player);
    }

    console.log('✅ Created 10 sample players');

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      credentials: {
        admin: { email: 'admin@teamstats.com', password: 'admin123' },
        manager: { email: 'manager@teamstats.com', password: 'manager123' }
      }
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    
    // Return detailed error info for debugging
    return NextResponse.json(
      { 
        error: 'Database setup failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}