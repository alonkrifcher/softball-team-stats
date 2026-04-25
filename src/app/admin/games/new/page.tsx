import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { createGame } from '@/app/_actions/admin';

export const dynamic = 'force-dynamic';

export default async function NewGamePage() {
  const allSeasons = await db.select().from(seasons).orderBy(desc(seasons.year));
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">New game</h1>
      <form
        className="card space-y-3"
        action={async (fd: FormData) => {
          'use server';
          const id = await createGame(fd);
          redirect(`/admin/games/${id}`);
        }}
      >
        <div>
          <label className="label">Season</label>
          <select name="seasonId" className="input" required>
            {allSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" name="playedOn" type="date" required />
        </div>
        <div>
          <label className="label">Opponent</label>
          <input className="input" name="opponent" />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" name="location" />
        </div>
        <button className="btn">Create</button>
      </form>
    </div>
  );
}
