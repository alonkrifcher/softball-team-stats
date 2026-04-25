import Link from 'next/link';
import { db } from '@/lib/db';
import { games, seasons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year, 10) : null;
  const allSeasons = await db.select().from(seasons).orderBy(desc(seasons.year));
  let q = db
    .select({ g: games, s: seasons })
    .from(games)
    .innerJoin(seasons, eq(seasons.id, games.seasonId))
    .orderBy(desc(games.playedOn))
    .$dynamic();
  if (year) q = q.where(eq(seasons.year, year));
  const rows = await q.limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Games</h1>
        <Link href="/admin/games/new" className="btn">
          New game
        </Link>
      </div>
      <div className="flex gap-2 text-sm">
        <Link href="/admin/games" className={year == null ? 'font-bold text-team' : 'text-slate-600 hover:text-team'}>
          All
        </Link>
        {allSeasons.map((s) => (
          <Link
            key={s.id}
            href={`/admin/games?year=${s.year}`}
            className={year === s.year ? 'font-bold text-team' : 'text-slate-600 hover:text-team'}
          >
            {s.year}
          </Link>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Season</th>
            <th className="px-2 py-2">Opponent</th>
            <th className="px-2 py-2">Score</th>
            <th className="px-2 py-2">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ g, s }) => (
            <tr key={g.id} className="border-b border-slate-100">
              <td className="px-2 py-2">{fmtDate(g.playedOn)}</td>
              <td className="px-2 py-2">{s.year}</td>
              <td className="px-2 py-2">{g.opponent ?? '—'}</td>
              <td className="px-2 py-2 tabular-nums">
                {g.uhjRuns != null && g.oppRuns != null ? `${g.uhjRuns}-${g.oppRuns}` : '—'}
              </td>
              <td className="px-2 py-2">{g.status}</td>
              <td className="px-2 py-2 text-right">
                <Link href={`/admin/games/${g.id}`} className="text-team underline">edit</Link>{' '}
                <Link href={`/admin/games/${g.id}/stats`} className="text-team underline">stats</Link>{' '}
                <Link href={`/admin/games/${g.id}/scoresheet`} className="text-team underline">scoresheet</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
