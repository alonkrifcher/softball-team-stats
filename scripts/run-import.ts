#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import * as fs from 'fs';
import { sql } from 'drizzle-orm';

async function runImport() {
  try {
    console.log('🚀 Starting database import...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('underhand-jobs-import.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        try {
          await db.execute(sql.raw(statement));
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error(`Statement was: ${statement.substring(0, 100)}...`);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Database import completed!');
    
    // Verify import
    console.log('\n🔍 Verifying import...');
    const playerCount = await db.execute(sql`SELECT COUNT(*) as count FROM players`);
    const gameCount = await db.execute(sql`SELECT COUNT(*) as count FROM games`);
    const statsCount = await db.execute(sql`SELECT COUNT(*) as count FROM player_game_stats`);
    
    console.log(`👥 Players: ${(playerCount.rows[0] as any).count}`);
    console.log(`🎮 Games: ${(gameCount.rows[0] as any).count}`);
    console.log(`📊 Player-game stats: ${(statsCount.rows[0] as any).count}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

runImport();