import Link from 'next/link';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { updateGame } from '@/app/_actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const rows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!rows.length) notFound();
  const g = rows[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit game</h1>
        <div className="flex gap-2 text-sm">
          <Link className="btn-secondary" href={`/admin/games/${gameId}/stats`}>
            Stats
          </Link>
          <Link className="btn-secondary" href={`/admin/games/${gameId}/scoresheet`}>
            Scoresheet
          </Link>
        </div>
      </div>
      <form className="card grid gap-3 md:grid-cols-2" action={updateGame}>
        <input type="hidden" name="gameId" value={g.id} />
        <div>
          <label className="label">Date</label>
          <input className="input" name="playedOn" type="date" defaultValue={g.playedOn} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" name="status" defaultValue={g.status}>
            <option value="scheduled">scheduled</option>
            <option value="final">final</option>
            <option value="historical">historical</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Opponent</label>
          <input className="input" name="opponent" defaultValue={g.opponent ?? ''} />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" name="location" defaultValue={g.location ?? ''} />
        </div>
        <div>
          <label className="label">UHJ runs</label>
          <input className="input" name="uhjRuns" type="number" defaultValue={g.uhjRuns ?? ''} />
        </div>
        <div>
          <label className="label">Opp runs</label>
          <input className="input" name="oppRuns" type="number" defaultValue={g.oppRuns ?? ''} />
        </div>
        <div>
          <label className="label">Result</label>
          <select className="input" name="result" defaultValue={g.result ?? ''}>
            <option value="">(auto)</option>
            <option value="W">W</option>
            <option value="L">L</option>
            <option value="T">T</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Notes</label>
          <textarea className="input" rows={3} name="notes" defaultValue={g.notes ?? ''} />
        </div>
        <div className="md:col-span-2">
          <button className="btn">Save</button>
        </div>
      </form>
    </div>
  );
}
