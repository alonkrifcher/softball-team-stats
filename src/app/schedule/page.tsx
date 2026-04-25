import Link from 'next/link';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getCurrentSeason, listSeasons } from '@/lib/seasons';
import { GamesTable } from '@/components/GamesTable';
import { syncSeasonIcalCached } from '@/lib/ical-sync';

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

  // Best-effort cached iCal sync
  if (season.icalUrl) {
    try {
      await syncSeasonIcalCached(season.id, season.icalUrl);
    } catch (e) {
      console.error('iCal sync (cached) failed:', e);
    }
  }

  const seasonGames = await db
    .select()
    .from(games)
    .where(eq(games.seasonId, season.id))
    .orderBy(asc(games.playedOn));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{season.label} schedule</h1>
        <div className="flex gap-3 text-sm">
          {seasons
            .filter((s) => s.year !== season.year)
            .map((s) => (
              <Link key={s.id} href={`/history/${s.year}`} className="text-team hover:underline">
                {s.year}
              </Link>
            ))}
        </div>
      </div>
      <GamesTable games={seasonGames} />
    </div>
  );
}
