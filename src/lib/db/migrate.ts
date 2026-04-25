import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DIRECT_URL or DATABASE_URL required');

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  console.log('Running drizzle migrations...');
  await migrate(db, { migrationsFolder: './migrations' });

  // Apply manual SQL files (views, etc.) numbered 9999_*.sql
  const dir = './migrations';
  const manual = readdirSync(dir).filter((f) => /^9\d{3}_.+\.sql$/.test(f)).sort();
  for (const f of manual) {
    console.log(`Applying ${f}`);
    const body = readFileSync(join(dir, f), 'utf8');
    await sql.unsafe(body);
  }

  console.log('Done.');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
