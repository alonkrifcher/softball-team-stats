import Link from 'next/link';
import { teamRecordsAllYears } from '@/lib/queries';
import { listSeasons } from '@/lib/seasons';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const records = await teamRecordsAllYears();
  const seasons = await listSeasons();
  const recordsByYear = new Map(records.map((r) => [r.year, r]));

  return (
    <div className="space-y-4">
      <header>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Seasons</div>
        <h1 className="text-2xl font-bold">All-time</h1>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s) => {
          const rec = recordsByYear.get(s.year);
          const winPct = rec && rec.wins + rec.losses > 0 ? rec.wins / (rec.wins + rec.losses) : null;
          return (
            <Link
              key={s.id}
              href={`/history/${s.year}`}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:border-team"
            >
              <div className="bg-gradient-to-br from-team to-team-dark px-4 py-3 text-white">
                <div className="text-xs uppercase tracking-widest opacity-80">{s.label}</div>
                <div className="text-2xl font-bold">{s.year}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-3xl font-black tabular-nums">
                  {rec ? `${rec.wins}-${rec.losses}${rec.ties ? `-${rec.ties}` : ''}` : '—'}
                </div>
                {winPct != null ? (
                  <div className="text-sm text-slate-500">
                    {(winPct * 100).toFixed(0)}% win rate
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">no records yet</div>
                )}
                {rec ? (
                  <div className="mt-1 text-xs text-slate-500">
                    RF {rec.runs_for} · RA {rec.runs_against}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
