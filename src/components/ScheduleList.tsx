'use client';

import Link from 'next/link';
import { fmtDate, fmtTime } from '@/lib/format';

type Game = {
  id: string;
  playedOn: string;
  startTime: string | null;
  opponent: string | null;
  uhjRuns: number | null;
  oppRuns: number | null;
  result: 'W' | 'L' | 'T' | null;
  status: 'scheduled' | 'final' | 'historical' | 'cancelled';
  location: string | null;
};

function ResultBadge({ result, status }: { result: Game['result']; status: Game['status'] }) {
  if (status === 'cancelled') {
    return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">CXLD</span>;
  }
  if (!result) return null;
  const tone =
    result === 'W'
      ? 'bg-green-600 text-white'
      : result === 'L'
        ? 'bg-red-600 text-white'
        : 'bg-slate-500 text-white';
  return <span className={`rounded px-2 py-0.5 text-xs font-bold ${tone}`}>{result}</span>;
}

export function ScheduleList({ games }: { games: Game[] }) {
  // Group games by month
  const groups = new Map<string, Game[]>();
  for (const g of games) {
    const key = g.playedOn.slice(0, 7); // YYYY-MM
    const arr = groups.get(key) ?? [];
    arr.push(g);
    groups.set(key, arr);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([key, gs]) => (
        <div key={key}>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            {monthLabel(key)}
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {gs.map((g, i) => (
              <Link
                key={g.id}
                href={`/schedule/${g.id}`}
                className={
                  'flex items-stretch gap-3 px-4 py-3 hover:bg-slate-50 ' +
                  (i > 0 ? 'border-t border-slate-100' : '')
                }
              >
                <div className="w-14 shrink-0 text-center">
                  <div className="text-xs font-medium uppercase text-slate-500">
                    {fmtDate(g.playedOn).split(',')[0]}
                  </div>
                  <div className="text-2xl font-black leading-tight text-team-dark tabular-nums">
                    {parseInt(g.playedOn.slice(8, 10), 10)}
                  </div>
                  {g.startTime ? <div className="text-xs text-slate-500">{fmtTime(g.startTime)}</div> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase text-slate-400">vs</span>
                    <span className="truncate text-base font-semibold">{g.opponent ?? 'TBD'}</span>
                  </div>
                  {g.location ? <div className="truncate text-xs text-slate-500">{g.location}</div> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  {g.uhjRuns != null && g.oppRuns != null ? (
                    <div className="tabular-nums">
                      <span className="text-lg font-bold">{g.uhjRuns}</span>
                      <span className="mx-1 text-slate-400">–</span>
                      <span className="text-lg font-bold">{g.oppRuns}</span>
                    </div>
                  ) : g.status === 'scheduled' ? (
                    <span className="rounded bg-team-accent/20 px-2 py-1 text-xs font-bold text-team-dark">
                      RSVP
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  <ResultBadge result={g.result} status={g.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
      {games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No games yet. Sync the iCal feed in admin.
        </div>
      ) : null}
    </div>
  );
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
