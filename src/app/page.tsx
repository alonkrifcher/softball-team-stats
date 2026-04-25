import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { and, asc, eq, gte } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/seasons';
import { teamRecord } from '@/lib/queries';
import { RecordCard } from '@/components/RecordCard';
import { NextGameCard } from '@/components/NextGameCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const season = await getCurrentSeason();
  const today = new Date().toISOString().slice(0, 10);

  let next = null;
  let record = null;
  if (season) {
    const upcoming = await db
      .select()
      .from(games)
      .where(and(eq(games.seasonId, season.id), gte(games.playedOn, today), eq(games.status, 'scheduled')))
      .orderBy(asc(games.playedOn))
      .limit(1);
    next = upcoming[0] ?? null;
    record = await teamRecord(season.id);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-team">Underhand Jobs</h1>
        <p className="text-slate-600">{season?.label ?? 'No active season'}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <RecordCard
          label={`${season?.label ?? 'Current'} record`}
          wins={record?.wins ?? 0}
          losses={record?.losses ?? 0}
          ties={record?.ties ?? 0}
          runsFor={record?.runs_for ?? 0}
          runsAgainst={record?.runs_against ?? 0}
        />
        <NextGameCard game={next} />
      </div>
    </div>
  );
}
