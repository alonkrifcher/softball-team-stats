import Link from 'next/link';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getCurrentSeason, listSeasons } from '@/lib/seasons';
import { ScheduleList } from '@/components/ScheduleList';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const season = await getCurrentSeason();
  const seasons = await listSeasons();
  if (!season) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">Schedule</h1>
        <p>No current season set up yet.</p>
      </div>
    );
  }

  const seasonGames = await db
    .select()
    .from(games)
    .where(eq(games.seasonId, season.id))
    .orderBy(asc(games.playedOn));

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Schedule</div>
          <h1 className="text-2xl font-bold">{season.label}</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {seasons
            .filter((s) => s.year !== season.year)
            .map((s) => (
              <Link
                key={s.id}
                href={`/history/${s.year}`}
                className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:border-team hover:text-team"
              >
                {s.year}
              </Link>
            ))}
        </div>
      </header>
      <ScheduleList
        games={seasonGames.map((g) => ({
          id: g.id,
          playedOn: g.playedOn,
          startTime: g.startTime instanceof Date ? g.startTime.toISOString() : (g.startTime as string | null),
          opponent: g.opponent,
          uhjRuns: g.uhjRuns,
          oppRuns: g.oppRuns,
          result: g.result,
          status: g.status,
          location: g.location,
        }))}
      />
    </div>
  );
}
