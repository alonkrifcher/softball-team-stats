import Link from 'next/link';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/seasons';

export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  const [all, season] = await Promise.all([
    db.select().from(players).orderBy(asc(players.displayName)),
    getCurrentSeason(),
  ]);
  const active = all.filter((p) => p.active);
  const alumni = all.filter((p) => !p.active);

  function card(p: (typeof all)[number]) {
    return (
      <Link
        key={p.id}
        href={`/players/${p.slug}`}
        className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-team"
      >
        <div
          className={
            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ' +
            (p.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700')
          }
        >
          {p.displayName
            .split(/\s+/)
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-slate-900 group-hover:text-team">{p.displayName}</div>
          <div className="text-xs text-slate-500">
            {p.gender}
            {p.jerseyNumber != null ? ` · #${p.jerseyNumber}` : ''}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Roster</div>
        <h1 className="text-2xl font-bold">{season?.label ?? 'Underhand Jobs'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {active.length} active player{active.length === 1 ? '' : 's'}
          {alumni.length ? ` · ${alumni.length} alumni` : ''}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          On the roster
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{active.map(card)}</div>
      </section>

      {alumni.length ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            Alumni
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{alumni.map(card)}</div>
        </section>
      ) : null}
    </div>
  );
}
