import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { players, playerAliases } from '../src/lib/db/schema';
import { slugify } from '../src/lib/utils';
import { parseCsv } from './_csv';

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  const list = parseCsv('data/player_list.csv');
  const aliases = JSON.parse(readFileSync('data/aliases.json', 'utf8'))._aliases as Record<string, string[]>;

  const usedSlugs = new Set<string>();
  let inserted = 0;
  let updated = 0;

  for (const row of list) {
    const name = (row['Player'] || '').trim();
    const gender = (row['Gender'] || '').trim().toUpperCase();
    if (!name || !['M', 'F'].includes(gender)) {
      console.warn('skip row', row);
      continue;
    }
    let slug = slugify(name);
    if (!slug) continue;
    let i = 2;
    let candidate = slug;
    while (usedSlugs.has(candidate)) {
      candidate = `${slug}-${i++}`;
    }
    slug = candidate;
    usedSlugs.add(slug);

    const existing = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
    if (existing.length) {
      await db
        .update(players)
        .set({ displayName: name, gender: gender as 'M' | 'F', updatedAt: new Date() })
        .where(eq(players.id, existing[0].id));
      updated++;
      // ensure self-alias
      try {
        await db.insert(playerAliases).values({ playerId: existing[0].id, alias: name }).onConflictDoNothing();
      } catch {}
    } else {
      const [p] = await db
        .insert(players)
        .values({ displayName: name, slug, gender: gender as 'M' | 'F' })
        .returning();
      await db.insert(playerAliases).values({ playerId: p.id, alias: name }).onConflictDoNothing();
      inserted++;
    }
  }

  // Apply hand-curated aliases
  for (const [slug, extras] of Object.entries(aliases ?? {})) {
    const rows = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
    if (!rows.length) {
      console.warn(`alias target slug not found: ${slug}`);
      continue;
    }
    for (const a of extras) {
      try {
        await db.insert(playerAliases).values({ playerId: rows[0].id, alias: a }).onConflictDoNothing();
      } catch (e) {
        console.warn(`alias ${a} -> ${slug}:`, e);
      }
    }
  }

  console.log(`Roster seed: inserted=${inserted}, updated=${updated}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
