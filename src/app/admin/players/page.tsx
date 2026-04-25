import { db } from '@/lib/db';
import { players, playerAliases } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { upsertPlayer, addAlias } from '@/app/_actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminPlayersPage() {
  const roster = await db.select().from(players).orderBy(asc(players.displayName));
  const aliases = await db.select().from(playerAliases);
  const aliasByPlayer = new Map<string, string[]>();
  for (const a of aliases) {
    const arr = aliasByPlayer.get(a.playerId) ?? [];
    arr.push(a.alias);
    aliasByPlayer.set(a.playerId, arr);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Roster admin</h1>

      <section className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">New player</h2>
        <form action={upsertPlayer} className="grid gap-2 md:grid-cols-4">
          <input className="input md:col-span-2" name="displayName" placeholder="Display name" required />
          <select className="input" name="gender" required>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
          <input className="input" name="jerseyNumber" type="number" placeholder="#" />
          <button className="btn md:col-span-4">Add player</button>
        </form>
      </section>

      <section>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Gender</th>
              <th className="px-2 py-2">Active</th>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Aliases</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {roster.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 align-top">
                <td className="px-2 py-2">
                  <form action={upsertPlayer} className="flex flex-col gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="gender" value={p.gender} />
                    <input className="input" name="displayName" defaultValue={p.displayName} />
                  </form>
                </td>
                <td className="px-2 py-2">{p.gender}</td>
                <td className="px-2 py-2">
                  <form action={upsertPlayer} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="displayName" value={p.displayName} />
                    <input type="hidden" name="gender" value={p.gender} />
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={p.active}
                      className="h-5 w-5"
                      onChange={(e) => {
                        const target = e.currentTarget;
                        const form = target.form;
                        if (form) form.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="px-2 py-2 tabular-nums">{p.jerseyNumber ?? ''}</td>
                <td className="px-2 py-2 text-xs">
                  {(aliasByPlayer.get(p.id) ?? []).join(', ')}
                  <form
                    action={async (fd: FormData) => {
                      'use server';
                      const a = String(fd.get('alias') ?? '').trim();
                      if (a) await addAlias(p.id, a);
                    }}
                    className="mt-1 flex gap-1"
                  >
                    <input className="input text-xs" name="alias" placeholder="add alias" />
                    <button className="btn-secondary px-2 py-1 text-xs">+</button>
                  </form>
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
