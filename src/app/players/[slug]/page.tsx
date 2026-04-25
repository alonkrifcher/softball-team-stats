import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { statsForPlayer } from '@/lib/queries';
import { StatsTable } from '@/components/StatsTable';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
  if (!rows.length) notFound();
  const p = rows[0];

  const seasonRows = await statsForPlayer(p.id);
  const career = seasonRows.reduce(
    (acc, s) => {
      acc.games += s.games || 0;
      acc.ab += s.ab || 0;
      acc.r += s.r || 0;
      acc.h += s.h || 0;
      acc.singles += s.singles || 0;
      acc.doubles += s.doubles || 0;
      acc.triples += s.triples || 0;
      acc.hr += s.hr || 0;
      acc.rbi += s.rbi || 0;
      acc.bb += s.bb || 0;
      acc.k += s.k || 0;
      acc.sac += s.sac || 0;
      return acc;
    },
    { games: 0, ab: 0, r: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sac: 0 }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">{p.displayName}</h1>
        <div className="text-sm text-slate-500">
          {p.gender} · {p.active ? 'Active' : 'Alumni'}
          {p.jerseyNumber != null ? ` · #${p.jerseyNumber}` : ''}
        </div>
      </header>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Career</h2>
        <StatsTable
          linkPlayer={false}
          rows={[
            {
              player_id: p.id,
              display_name: p.displayName,
              slug: p.slug,
              gender: p.gender as 'M' | 'F',
              ...career,
              avg: career.ab ? career.h / career.ab : 0,
              obp: career.ab + career.bb ? (career.h + career.bb) / (career.ab + career.bb) : 0,
              slg: career.ab
                ? (career.singles + 2 * career.doubles + 3 * career.triples + 4 * career.hr) / career.ab
                : 0,
            },
          ]}
        />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">By season</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b">
              <tr className="text-right">
                <th className="px-2 py-2 text-left">Season</th>
                <th className="px-2 py-2">G</th>
                <th className="px-2 py-2">AB</th>
                <th className="px-2 py-2">H</th>
                <th className="px-2 py-2">HR</th>
                <th className="px-2 py-2">RBI</th>
                <th className="px-2 py-2">BB</th>
                <th className="px-2 py-2">K</th>
                <th className="px-2 py-2">AVG</th>
                <th className="px-2 py-2">OBP</th>
                <th className="px-2 py-2">SLG</th>
              </tr>
            </thead>
            <tbody>
              {seasonRows.map((s) => (
                <tr key={s.season_id} className="border-b border-slate-100">
                  <td className="px-2 py-1.5">{s.season_label}</td>
                  <td className="px-2 py-1.5 text-right">{s.games}</td>
                  <td className="px-2 py-1.5 text-right">{s.ab}</td>
                  <td className="px-2 py-1.5 text-right">{s.h}</td>
                  <td className="px-2 py-1.5 text-right">{s.hr}</td>
                  <td className="px-2 py-1.5 text-right">{s.rbi}</td>
                  <td className="px-2 py-1.5 text-right">{s.bb}</td>
                  <td className="px-2 py-1.5 text-right">{s.k}</td>
                  <td className="px-2 py-1.5 text-right">{(s.avg ?? 0).toFixed(3).replace(/^0/, '')}</td>
                  <td className="px-2 py-1.5 text-right">{(s.obp ?? 0).toFixed(3).replace(/^0/, '')}</td>
                  <td className="px-2 py-1.5 text-right">{(s.slg ?? 0).toFixed(3).replace(/^0/, '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
