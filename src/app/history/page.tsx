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
      <h1 className="text-xl font-bold">Seasons</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {seasons.map((s) => {
          const rec = recordsByYear.get(s.year);
          return (
            <Link key={s.id} href={`/history/${s.year}`} className="card hover:border-team">
              <div className="text-sm text-slate-500">{s.label}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">
                {rec ? `${rec.wins}-${rec.losses}${rec.ties ? `-${rec.ties}` : ''}` : '—'}
              </div>
              {rec ? (
                <div className="text-sm text-slate-500">
                  RF {rec.runs_for} / RA {rec.runs_against}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
