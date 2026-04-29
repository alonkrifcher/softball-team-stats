import Link from 'next/link';
import { getCurrentSeason } from '@/lib/seasons';
import { statsForSeason } from '@/lib/queries';
import { StatsTable } from '@/components/StatsTable';
import { fmtAvg } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Leader = { player_id: string; display_name: string; slug: string; value: number; secondary: string };

function pickLeader<T extends { player_id: string; display_name: string; slug: string; ab: number }>(
  rows: T[],
  key: (r: T) => number,
  minAb = 5,
  fmt: (v: number, r: T) => string = (v) => String(v)
): Leader | null {
  const eligible = rows.filter((r) => r.ab >= minAb);
  if (!eligible.length) return null;
  const best = [...eligible].sort((a, b) => key(b) - key(a))[0];
  return {
    player_id: best.player_id,
    display_name: best.display_name,
    slug: best.slug,
    value: key(best),
    secondary: fmt(key(best), best),
  };
}

export default async function StatsPage() {
  const season = await getCurrentSeason();
  if (!season) return <p>No current season set.</p>;
  const rows = await statsForSeason(season.id);

  const leaders: { label: string; leader: Leader | null }[] = [
    {
      label: 'Batting Avg',
      leader: pickLeader(rows, (r) => r.avg ?? 0, 5, (v) => fmtAvg(v)),
    },
    {
      label: 'Home Runs',
      leader: pickLeader(rows, (r) => r.hr ?? 0, 0, (v) => String(v)),
    },
    {
      label: 'RBI',
      leader: pickLeader(rows, (r) => r.rbi ?? 0, 0, (v) => String(v)),
    },
    {
      label: 'OPS',
      leader: pickLeader(rows, (r) => (r.obp ?? 0) + (r.slg ?? 0), 5, (v) => fmtAvg(v)),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Stats</div>
          <h1 className="text-2xl font-bold">{season.label} batting</h1>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/stats" className="rounded bg-team px-3 py-1 font-medium text-white">
            This season
          </Link>
          <Link
            href="/stats/career"
            className="rounded border border-slate-300 px-3 py-1 text-slate-600 hover:border-team hover:text-team"
          >
            Career
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {leaders.map(({ label, leader }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            {leader ? (
              <>
                <div className="mt-1 text-2xl font-black tabular-nums text-team-dark">{leader.secondary}</div>
                <Link href={`/players/${leader.slug}`} className="text-sm text-team hover:underline">
                  {leader.display_name}
                </Link>
              </>
            ) : (
              <div className="mt-1 text-sm text-slate-400">—</div>
            )}
          </div>
        ))}
      </section>

      <section>
        <StatsTable rows={rows} />
      </section>
    </div>
  );
}
