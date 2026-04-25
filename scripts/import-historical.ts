import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { writeFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import { players, playerAliases, seasons, games, battingLines } from '../src/lib/db/schema';
import { parseCsv } from './_csv';

const CURRENT_YEAR = 2026;
const CURRENT_LABEL = '2026 Spring/Summer';
const CURRENT_ICAL =
  'https://www.teamsideline.com/Common/Calendar_ical.aspx?d=vseBS5X6j9rHlQ%2bsuRfgXWjT98vRaJGThzuqRoy47gUsEd%2fCYq1cL6tVdIfq1zdA';

function int(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}
function intOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  // 1. Seasons
  const allYears = new Set<number>([CURRENT_YEAR]);
  const gameRows = parseCsv('data/game_data.csv');
  for (const r of gameRows) {
    const y = parseInt(r['Year'], 10);
    if (!Number.isNaN(y)) allYears.add(y);
  }

  const seasonByYear = new Map<number, string>();
  for (const y of [...allYears].sort()) {
    const isCurrent = y === CURRENT_YEAR;
    const existing = await db.select().from(seasons).where(eq(seasons.year, y)).limit(1);
    if (existing.length) {
      seasonByYear.set(y, existing[0].id);
      if (isCurrent && !existing[0].icalUrl) {
        await db.update(seasons).set({ icalUrl: CURRENT_ICAL, isCurrent: true }).where(eq(seasons.id, existing[0].id));
      }
    } else {
      const [row] = await db
        .insert(seasons)
        .values({
          year: y,
          label: isCurrent ? CURRENT_LABEL : `${y} Season`,
          icalUrl: isCurrent ? CURRENT_ICAL : null,
          isCurrent,
        })
        .returning();
      seasonByYear.set(y, row.id);
    }
  }
  console.log(`Seasons: ${seasonByYear.size}`);

  // 2. Games
  const gameKey = new Map<string, string>(); // year-num -> game uuid
  let gamesInserted = 0;
  let gamesUpdated = 0;
  for (const r of gameRows) {
    const year = parseInt(r['Year'], 10);
    const num = parseInt(r['Game'], 10);
    const playedOn = r['Date'];
    if (!year || !num || !playedOn) continue;
    const seasonId = seasonByYear.get(year)!;
    const opponent = r['Opponent'] || null;
    const uhjRuns = intOrNull(r['UHJ Runs']);
    const oppRuns = intOrNull(r['Opp Runs']);
    let resultLetter: 'W' | 'L' | 'T' | null = null;
    const resStr = (r['Result'] || '').trim().toUpperCase();
    if (resStr.startsWith('W')) resultLetter = 'W';
    else if (resStr.startsWith('L')) resultLetter = 'L';
    else if (resStr.startsWith('T')) resultLetter = 'T';
    else if (uhjRuns != null && oppRuns != null) {
      if (uhjRuns > oppRuns) resultLetter = 'W';
      else if (uhjRuns < oppRuns) resultLetter = 'L';
      else resultLetter = 'T';
    }
    const notes = r['Notes'] || null;

    const existing = await db
      .select()
      .from(games)
      .where(and(eq(games.seasonId, seasonId), eq(games.gameNumber, num)))
      .limit(1);

    if (existing.length) {
      await db
        .update(games)
        .set({
          playedOn,
          opponent,
          uhjRuns,
          oppRuns,
          result: resultLetter,
          status: 'historical',
          notes,
          updatedAt: new Date(),
        })
        .where(eq(games.id, existing[0].id));
      gameKey.set(`${year}-${num}`, existing[0].id);
      gamesUpdated++;
    } else {
      const [row] = await db
        .insert(games)
        .values({
          seasonId,
          gameNumber: num,
          playedOn,
          opponent,
          uhjRuns,
          oppRuns,
          result: resultLetter,
          status: 'historical',
          notes,
        })
        .returning();
      gameKey.set(`${year}-${num}`, row.id);
      gamesInserted++;
    }
  }
  console.log(`Games: inserted=${gamesInserted}, updated=${gamesUpdated}`);

  // 3. Build alias map
  const aliasRows = await db.select().from(playerAliases);
  const aliasMap = new Map<string, string>();
  for (const a of aliasRows) aliasMap.set(a.alias.toLowerCase(), a.playerId);

  // 4. Batting lines
  const playerData = parseCsv('data/player_data.csv');
  const unmatched: Record<string, string>[] = [];
  let linesInserted = 0;
  let linesUpdated = 0;
  let linesSkipped = 0;

  for (const r of playerData) {
    const year = parseInt(r['Year'], 10);
    const num = parseInt(r['Game'], 10);
    const name = (r['Name'] || '').trim();
    if (!year || !num || !name) continue;
    const gameId = gameKey.get(`${year}-${num}`);
    if (!gameId) {
      console.warn(`no game for ${year}-${num}`);
      linesSkipped++;
      continue;
    }
    const playerId = aliasMap.get(name.toLowerCase());
    if (!playerId) {
      unmatched.push({ year: String(year), game: String(num), name });
      continue;
    }

    const ab = int(r['AB']);
    const r_ = int(r['R']);
    const h = int(r['H']);
    const doubles = int(r['2B']);
    const triples = int(r['3B']);
    const hr = int(r['HR']);
    let singles = int(r['1B']);
    if (!singles && h) singles = h - doubles - triples - hr;
    const rbi = int(r['RBI']);
    const bb = int(r['BB']);
    const k = int(r['K']);
    const sac = int(r['Sac']);

    if (h !== singles + doubles + triples + hr) {
      console.warn(`h-mismatch ${year}-${num} ${name}: h=${h} 1B=${singles} 2B=${doubles} 3B=${triples} HR=${hr}`);
      linesSkipped++;
      continue;
    }
    if (ab < h + k) {
      console.warn(`ab-too-small ${year}-${num} ${name}: ab=${ab} h=${h} k=${k}`);
      linesSkipped++;
      continue;
    }

    const existing = await db
      .select()
      .from(battingLines)
      .where(and(eq(battingLines.gameId, gameId), eq(battingLines.playerId, playerId)))
      .limit(1);

    if (existing.length) {
      await db
        .update(battingLines)
        .set({ ab, r: r_, h, singles, doubles, triples, hr, rbi, bb, k, sac, source: 'xlsx', updatedAt: new Date() })
        .where(eq(battingLines.id, existing[0].id));
      linesUpdated++;
    } else {
      await db.insert(battingLines).values({
        gameId,
        playerId,
        ab,
        r: r_,
        h,
        singles,
        doubles,
        triples,
        hr,
        rbi,
        bb,
        k,
        sac,
        source: 'xlsx',
      });
      linesInserted++;
    }
  }

  console.log(`Batting lines: inserted=${linesInserted}, updated=${linesUpdated}, skipped=${linesSkipped}`);
  if (unmatched.length) {
    const lines = ['year,game,name', ...unmatched.map((u) => `${u.year},${u.game},"${u.name.replace(/"/g, '""')}"`)];
    writeFileSync('data/unmatched.csv', lines.join('\n'));
    console.error(`UNMATCHED NAMES: ${unmatched.length}. See data/unmatched.csv`);
    await sql.end();
    process.exit(1);
  }

  // Total games count
  const totalGames = await db.select().from(games);
  const finalLike = totalGames.filter((g) => g.result != null);
  console.log(`Total games: ${totalGames.length} (with result: ${finalLike.length})`);

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
