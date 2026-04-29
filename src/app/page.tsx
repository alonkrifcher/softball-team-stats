import Link from 'next/link';
import { db } from '@/lib/db';
import { games, type Game } from '@/lib/db/schema';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/seasons';
import { teamRecord, statsForSeason, type SeasonStatRow } from '@/lib/queries';
import { fmtAvg } from '@/lib/utils';
import { fmtDateTime, fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const season = await getCurrentSeason();
  const today = new Date().toISOString().slice(0, 10);

  let next: Game | null = null;
  let lastTwo: Game[] = [];
  let record: Awaited<ReturnType<typeof teamRecord>> = null;
  let topHitters: SeasonStatRow[] = [];
  if (season) {
    const upcoming = await db
      .select()
      .from(games)
      .where(and(eq(games.seasonId, season.id), gte(games.playedOn, today), eq(games.status, 'scheduled')))
      .orderBy(asc(games.playedOn))
      .limit(1);
    next = upcoming[0] ?? null;

    lastTwo = await db
      .select()
      .from(games)
      .where(and(eq(games.seasonId, season.id), lte(games.playedOn, today)))
      .orderBy(desc(games.playedOn))
      .limit(2);

    record = await teamRecord(season.id);
    const all = await statsForSeason(season.id);
    topHitters = all.filter((r) => (r.ab ?? 0) >= 3).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)).slice(0, 5);
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-team via-team-dark to-team-deep text-white shadow-lg">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">{season?.label ?? 'Underhand Jobs'}</div>
            <div className="mt-1 text-3xl font-extrabold">UNDERHAND JOBS</div>
            <div className="text-sm opacity-80">Coed softball · since 2018</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest opacity-70">Record</div>
              <div className="text-4xl font-black tabular-nums">
                {record?.wins ?? 0}-{record?.losses ?? 0}
                {record?.ties ? `-${record.ties}` : ''}
              </div>
              <div className="text-xs opacity-70">
                RF {record?.runs_for ?? 0} · RA {record?.runs_against ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next game */}
      {next ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Next up</h2>
          <Link
            href={`/schedule/${next.id}`}
            className="block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:border-team"
          >
            <div className="flex flex-col items-stretch gap-0 sm:flex-row">
              <div className="bg-team px-5 py-4 text-white sm:w-44">
                <div className="text-xs uppercase tracking-widest opacity-80">
                  {next.startTime ? fmtDate(next.startTime as unknown as string) : fmtDate(next.playedOn)}
                </div>
                <div className="mt-1 text-lg font-bold">
                  {next.startTime ? fmtDateTime(next.startTime as unknown as string).split('•')[1]?.trim() : 'TBD'}
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">UHJ vs</div>
                <div className="text-2xl font-bold">{next.opponent ?? 'TBD'}</div>
                {next.location ? <div className="text-sm text-slate-500">{next.location}</div> : null}
              </div>
              <div className="self-center px-5 py-4 text-sm font-medium text-team">
                Open game / RSVP →
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          No upcoming games scheduled. Sync the calendar in /admin.
        </section>
      )}

      {/* Recent results */}
      {lastTwo.length ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Recent results</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {lastTwo.map((g) => (
              <Link
                key={g.id}
                href={`/schedule/${g.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-team"
              >
                <div>
                  <div className="text-xs text-slate-500">{fmtDate(g.playedOn)}</div>
                  <div className="font-semibold">vs {g.opponent ?? 'TBD'}</div>
                </div>
                <div className="text-right">
                  {g.uhjRuns != null && g.oppRuns != null ? (
                    <div className="text-2xl font-bold tabular-nums">
                      {g.uhjRuns}–{g.oppRuns}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">no score</div>
                  )}
                  {g.result ? (
                    <span
                      className={
                        'mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ' +
                        (g.result === 'W'
                          ? 'bg-green-100 text-green-700'
                          : g.result === 'L'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700')
                      }
                    >
                      {g.result}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Top 5 hitters */}
      {topHitters.length ? (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Top hitters · {season?.year}</h2>
            <Link href="/stats" className="text-sm text-team hover:underline">
              All stats →
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-3 py-2 text-right">AB</th>
                  <th className="px-3 py-2 text-right">H</th>
                  <th className="px-3 py-2 text-right">HR</th>
                  <th className="px-3 py-2 text-right">RBI</th>
                  <th className="px-3 py-2 text-right">AVG</th>
                </tr>
              </thead>
              <tbody>
                {topHitters.map((p, i) => (
                  <tr key={p.player_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <span className="mr-2 text-slate-400">{i + 1}.</span>
                      <Link href={`/players/${p.slug}`} className="font-medium text-team hover:underline">
                        {p.display_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.ab}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.h}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.hr}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.rbi}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{fmtAvg(p.avg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
