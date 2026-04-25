import Link from 'next/link';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  const all = await db.select().from(players).orderBy(asc(players.displayName));
  const active = all.filter((p) => p.active);
  const alumni = all.filter((p) => !p.active);

  function card(p: (typeof all)[number]) {
    return (
      <Link
        key={p.id}
        href={`/players/${p.slug}`}
        className="card flex items-center justify-between hover:border-team"
      >
        <div>
          <div className="font-medium">{p.displayName}</div>
          <div className="text-xs text-slate-500">{p.gender}</div>
        </div>
        {p.jerseyNumber != null ? (
          <span className="rounded bg-slate-100 px-2 py-1 text-xs">#{p.jerseyNumber}</span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Roster</h1>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Active ({active.length})</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{active.map(card)}</div>
      </section>
      {alumni.length ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Alumni ({alumni.length})</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{alumni.map(card)}</div>
        </section>
      ) : null}
    </div>
  );
}
