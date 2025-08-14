import { db, users, seasons, players } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function setupSampleData() {
  console.log('Setting up sample data...');

  try {
    // Create sample admin user
    const adminPasswordHash = await hashPassword('admin123');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@teamstats.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }).returning();

    console.log('✅ Created admin user (admin@teamstats.com / admin123)');

    // Create sample manager user
    const managerPasswordHash = await hashPassword('manager123');
    const [managerUser] = await db.insert(users).values({
      email: 'manager@teamstats.com',
      passwordHash: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: 'manager',
    }).returning();

    console.log('✅ Created manager user (manager@teamstats.com / manager123)');

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
    console.log('\n🎉 Sample data setup complete!');
    console.log('\nYou can now login with:');
    console.log('Admin: admin@teamstats.com / admin123');
    console.log('Manager: manager@teamstats.com / manager123');
    
  } catch (error) {
    console.error('❌ Error setting up sample data:', error);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupSampleData().then(() => process.exit(0));
}

export { setupSampleData };