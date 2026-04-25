import { db } from '@/lib/db';
import { games, seasons } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { GamesTable } from '@/components/GamesTable';
import { StatsTable } from '@/components/StatsTable';
import { statsForYear, teamRecord } from '@/lib/queries';
import { RecordCard } from '@/components/RecordCard';

export const dynamic = 'force-dynamic';

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (Number.isNaN(year)) notFound();

  const sRows = await db.select().from(seasons).where(eq(seasons.year, year)).limit(1);
  if (!sRows.length) notFound();
  const season = sRows[0];

  const [seasonGames, statRows, rec] = await Promise.all([
    db.select().from(games).where(eq(games.seasonId, season.id)).orderBy(asc(games.playedOn)),
    statsForYear(year),
    teamRecord(season.id),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">{season.label}</h1>
      </header>
      <RecordCard
        label="Record"
        wins={rec?.wins ?? 0}
        losses={rec?.losses ?? 0}
        ties={rec?.ties ?? 0}
        runsFor={rec?.runs_for ?? 0}
        runsAgainst={rec?.runs_against ?? 0}
      />
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Schedule</h2>
        <GamesTable games={seasonGames} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Batting</h2>
        <StatsTable rows={statRows} />
      </section>
    </div>
  );
}
