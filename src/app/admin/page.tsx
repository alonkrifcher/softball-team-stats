import Link from 'next/link';
import { db } from '@/lib/db';
import { battingLines, games, players, scoresheetUploads } from '@/lib/db/schema';
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/seasons';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const season = await getCurrentSeason();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString().slice(0, 10);

  const [activePlayers, totalPlayers, upcomingGames, recentlyPlayed, recentUploads] = await Promise.all([
    db.select().from(players).where(eq(players.active, true)).then((r) => r.length),
    db.select().from(players).then((r) => r.length),
    season
      ? db
          .select()
          .from(games)
          .where(and(eq(games.seasonId, season.id), eq(games.status, 'scheduled'), gte(games.playedOn, today)))
          .orderBy(asc(games.playedOn))
          .limit(3)
      : Promise.resolve([]),
    season
      ? db
          .select()
          .from(games)
          .where(and(eq(games.seasonId, season.id), gte(games.playedOn, monthAgo), lte(games.playedOn, today)))
          .orderBy(desc(games.playedOn))
      : Promise.resolve([]),
    db.select().from(scoresheetUploads).orderBy(desc(scoresheetUploads.uploadedAt)).limit(5),
  ]);

  const gameIdsRecent = recentlyPlayed.map((g) => g.id);
  const gameIdsWithStats = gameIdsRecent.length
    ? new Set(
        (
          await db
            .selectDistinct({ id: battingLines.gameId })
            .from(battingLines)
            .where(inArray(battingLines.gameId, gameIdsRecent))
        ).map((r) => r.id)
      )
    : new Set<string>();
  const needStats = recentlyPlayed.filter((g) => !gameIdsWithStats.has(g.id));

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-team-light/30 bg-gradient-to-br from-team via-team-dark to-team-deep p-6 text-white">
        <div className="text-xs uppercase tracking-widest opacity-70">Admin</div>
        <h1 className="mt-1 text-2xl font-bold">{season?.label ?? 'No season set'}</h1>
        <p className="mt-1 text-sm opacity-80">
          {activePlayers}/{totalPlayers} players on roster · {upcomingGames.length} upcoming game{upcomingGames.length === 1 ? '' : 's'} · {needStats.length} game{needStats.length === 1 ? '' : 's'} need stats
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/games" className="rounded bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25">
            Manage games
          </Link>
          {season ? (
            <Link
              href={`/admin/seasons/${season.id}`}
              className="rounded bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
            >
              Sync schedule
            </Link>
          ) : null}
          <Link href="/admin/players" className="rounded bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25">
            Roster
          </Link>
          <Link
            href="/admin/games/new"
            className="rounded bg-team-accent px-3 py-2 text-sm font-medium text-team-dark hover:brightness-110"
          >
            + Add game
          </Link>
        </div>
      </div>

      {needStats.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Games needing stats
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {needStats.map((g) => (
              <Link
                key={g.id}
                href={`/admin/games/${g.id}/stats`}
                className="card flex items-center justify-between hover:border-team"
              >
                <div>
                  <div className="text-sm text-slate-500">{fmtDate(g.playedOn)}</div>
                  <div className="font-semibold">vs {g.opponent ?? 'TBD'}</div>
                  {g.uhjRuns != null && g.oppRuns != null ? (
                    <div className="text-sm text-slate-600">
                      Final: {g.uhjRuns}–{g.oppRuns}
                    </div>
                  ) : null}
                </div>
                <span className="rounded bg-team px-3 py-2 text-sm font-medium text-white">Enter stats →</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {upcomingGames.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Upcoming</h2>
          <div className="grid gap-2 md:grid-cols-3">
            {upcomingGames.map((g) => (
              <Link
                key={g.id}
                href={`/admin/games/${g.id}`}
                className="card hover:border-team"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">{fmtDate(g.playedOn)}</div>
                <div className="text-lg font-semibold">vs {g.opponent ?? 'TBD'}</div>
                {g.location ? <div className="text-xs text-slate-500">{g.location}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Recent scoresheet uploads
        </h2>
        <div className="card">
          {recentUploads.length === 0 ? (
            <p className="text-slate-400">No uploads yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentUploads.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/games/${u.gameId}/scoresheet/${u.id}`} className="text-team underline">
                    {u.id.slice(0, 8)}
                  </Link>{' '}
                  · {u.status} · {new Date(u.uploadedAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
