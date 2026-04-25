import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { loginPlayer } from '@/app/_actions/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const roster = await db
    .select()
    .from(players)
    .where(eq(players.active, true))
    .orderBy(asc(players.displayName));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Team login</h1>
      {sp.error === 'bad-passphrase' ? <p className="text-red-600">Wrong passphrase.</p> : null}
      {sp.error === 'unknown-player' ? <p className="text-red-600">Unknown player.</p> : null}
      <form action={loginPlayer} className="card space-y-3">
        <input type="hidden" name="next" value={sp.next ?? '/'} />
        <div>
          <label className="label" htmlFor="playerId">
            Who are you?
          </label>
          <select id="playerId" name="playerId" className="input" required>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="passphrase">
            Team passphrase
          </label>
          <input id="passphrase" name="passphrase" type="password" className="input" required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn w-full">
          Sign in
        </button>
      </form>
      <p className="text-xs text-slate-500">No accounts. The team passphrase is shared in Slack.</p>
    </div>
  );
}
