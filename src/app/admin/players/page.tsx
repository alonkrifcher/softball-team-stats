import { db } from '@/lib/db';
import { players, playerAliases } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { upsertPlayer, addAlias } from '@/app/_actions/admin';
import { RosterAdminTable } from '@/components/RosterAdminTable';
import { getCurrentSeason } from '@/lib/seasons';

export const dynamic = 'force-dynamic';

export default async function AdminPlayersPage() {
  const [roster, aliases, season] = await Promise.all([
    db.select().from(players).orderBy(asc(players.displayName)),
    db.select().from(playerAliases),
    getCurrentSeason(),
  ]);

  const aliasByPlayer = new Map<string, string[]>();
  for (const a of aliases) {
    const arr = aliasByPlayer.get(a.playerId) ?? [];
    arr.push(a.alias);
    aliasByPlayer.set(a.playerId, arr);
  }

  const active = roster.filter((p) => p.active);
  const inactive = roster.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Roster</h1>
        <p className="text-sm text-slate-600">
          {season?.label ?? 'No season set'} · {active.length} active · {inactive.length} alumni
        </p>
        <p className="mt-1 text-xs text-slate-500">
          "Active" means a player is on the current season's roster (sign-ups, subs, or new joiners). Toggle a player off when they're not playing this season.
        </p>
      </header>

      <section className="card border-2 border-team/30">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-600">+ Add new player (sub or new joiner)</h2>
        <form action={upsertPlayer} className="grid gap-2 md:grid-cols-[2fr_auto_auto_auto]">
          <input className="input" name="displayName" placeholder="Display name" required />
          <select className="input" name="gender" required>
            <option value="">Gender</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
          <input className="input w-24" name="jerseyNumber" type="number" placeholder="#" />
          <button className="btn">Add</button>
        </form>
      </section>

      <RosterAdminTable
        players={roster.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          slug: p.slug,
          gender: p.gender as 'M' | 'F',
          active: p.active,
          jerseyNumber: p.jerseyNumber,
          aliases: aliasByPlayer.get(p.id) ?? [],
        }))}
        addAlias={async (playerId: string, alias: string) => {
          'use server';
          await addAlias(playerId, alias);
        }}
      />
    </div>
  );
}
