import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export type SeasonStatRow = {
  player_id: string;
  display_name: string;
  slug: string;
  gender: 'M' | 'F';
  season_id: string;
  year: number;
  season_label: string;
  games: number;
  ab: number;
  r: number;
  h: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  k: number;
  sac: number;
  avg: number | null;
  obp: number | null;
  slg: number | null;
};

export type CareerStatRow = Omit<SeasonStatRow, 'season_id' | 'year' | 'season_label'>;

export type TeamRecord = {
  season_id: string;
  year: number;
  label: string;
  wins: number;
  losses: number;
  ties: number;
  runs_for: number;
  runs_against: number;
};

export async function statsForSeason(seasonId: string): Promise<SeasonStatRow[]> {
  const rows = await db.execute<SeasonStatRow>(sql`
    SELECT * FROM v_player_season_stats WHERE season_id = ${seasonId}
    ORDER BY ab DESC NULLS LAST, h DESC NULLS LAST
  `);
  return rows.map(coerceStat) as SeasonStatRow[];
}

export async function statsForYear(year: number): Promise<SeasonStatRow[]> {
  const rows = await db.execute<SeasonStatRow>(sql`
    SELECT * FROM v_player_season_stats WHERE year = ${year}
    ORDER BY ab DESC NULLS LAST, h DESC NULLS LAST
  `);
  return rows.map(coerceStat) as SeasonStatRow[];
}

export async function careerStats(): Promise<CareerStatRow[]> {
  const rows = await db.execute<CareerStatRow>(sql`
    SELECT * FROM v_player_career_stats
    ORDER BY ab DESC NULLS LAST
  `);
  return rows.map(coerceStat) as CareerStatRow[];
}

export async function statsForPlayer(playerId: string): Promise<SeasonStatRow[]> {
  const rows = await db.execute<SeasonStatRow>(sql`
    SELECT * FROM v_player_season_stats WHERE player_id = ${playerId}
    ORDER BY year DESC
  `);
  return rows.map(coerceStat) as SeasonStatRow[];
}

export async function teamRecord(seasonId: string): Promise<TeamRecord | null> {
  const rows = await db.execute<TeamRecord>(sql`
    SELECT * FROM v_team_season_record WHERE season_id = ${seasonId}
  `);
  return (rows[0] as TeamRecord) ?? null;
}

export async function teamRecordsAllYears(): Promise<TeamRecord[]> {
  const rows = await db.execute<TeamRecord>(sql`SELECT * FROM v_team_season_record ORDER BY year DESC`);
  return rows as TeamRecord[];
}

function coerceStat<T extends Record<string, unknown>>(r: T): T {
  const out: Record<string, unknown> = { ...r };
  for (const k of ['avg', 'obp', 'slg']) {
    const v = out[k];
    if (typeof v === 'string') out[k] = v === '' ? null : Number(v);
  }
  for (const k of ['games', 'ab', 'r', 'h', 'singles', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'k', 'sac', 'wins', 'losses', 'ties', 'runs_for', 'runs_against', 'year']) {
    const v = out[k];
    if (typeof v === 'string') out[k] = Number(v);
    if (v == null) out[k] = 0;
  }
  return out as T;
}
