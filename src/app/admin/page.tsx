import Link from 'next/link';
import { db } from '@/lib/db';
import { games, players, scoresheetUploads, seasons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/seasons';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const season = await getCurrentSeason();
  const [gameCount, playerCount, recentUploads] = await Promise.all([
    db.select().from(games).then((r) => r.length),
    db.select().from(players).then((r) => r.length),
    db.select().from(scoresheetUploads).orderBy(desc(scoresheetUploads.uploadedAt)).limit(10),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/admin/games" className="card hover:border-team">
          <div className="text-xs uppercase text-slate-500">Games</div>
          <div className="text-2xl font-bold">{gameCount}</div>
          <div className="text-xs text-slate-500">view all / edit</div>
        </Link>
        <Link href="/admin/players" className="card hover:border-team">
          <div className="text-xs uppercase text-slate-500">Players</div>
          <div className="text-2xl font-bold">{playerCount}</div>
          <div className="text-xs text-slate-500">roster</div>
        </Link>
        <Link href="/admin/seasons" className="card hover:border-team">
          <div className="text-xs uppercase text-slate-500">Current season</div>
          <div className="text-lg font-semibold">{season?.label ?? '—'}</div>
          <div className="text-xs text-slate-500">manage seasons</div>
        </Link>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Recent scoresheet uploads</h2>
        <div className="card">
          {recentUploads.length === 0 ? (
            <p className="text-slate-400">None.</p>
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
      </div>
    </div>
  );
}
