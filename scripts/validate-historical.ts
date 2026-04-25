import 'dotenv/config';
import postgres from 'postgres';
import { existsSync } from 'node:fs';
import { parseCsv } from './_csv';

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');
  const sql = postgres(url, { max: 1 });

  const years = [2018, 2019, 2021, 2022, 2023, 2024, 2025];
  let bigDiffs = 0;

  for (const y of years) {
    const path = `data/season_${y}.csv`;
    if (!existsSync(path)) {
      console.log(`(skip) ${path} missing`);
      continue;
    }
    const csv = parseCsv(path);
    if (!csv.length) {
      console.log(`(skip) ${path} empty`);
      continue;
    }
    const dbRows = await sql<
      { display_name: string; ab: number; h: number; bb: number; k: number; rbi: number }[]
    >`
      SELECT display_name, ab::int, h::int, bb::int, k::int, rbi::int
      FROM v_player_season_stats WHERE year = ${y}
    `;
    const dbByName = new Map(dbRows.map((r) => [r.display_name.toLowerCase(), r]));

    for (const row of csv) {
      const name = (row['Name'] || '').trim();
      if (!name) continue;
      const dbR = dbByName.get(name.toLowerCase());
      if (!dbR) {
        console.log(`[${y}] no DB row for ${name}`);
        bigDiffs++;
        continue;
      }
      const xab = parseInt(row['AB'] || '0', 10) || 0;
      if (Math.abs(dbR.ab - xab) > 1) {
        console.log(`[${y}] ${name}: AB xlsx=${xab} db=${dbR.ab}`);
        bigDiffs++;
      }
    }
  }

  console.log(`Validation done. large_discrepancies=${bigDiffs}`);
  await sql.end();
  if (bigDiffs > 5) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
