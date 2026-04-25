import Link from 'next/link';
import { db } from '@/lib/db';
import { games, seasons } from '@/lib/db/schema';
import { and, eq, isNull, asc } from 'drizzle-orm';
import { fmtDate } from '@/lib/format';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AdminHistoryGamesPage() {
  const rows = await db
    .select({ g: games, s: seasons })
    .from(games)
    .innerJoin(seasons, eq(seasons.id, games.seasonId))
    .where(and(eq(games.status, 'historical'), sql`(${games.opponent} IS NULL OR ${games.uhjRuns} IS NULL)`))
    .orderBy(asc(games.playedOn));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Backfill: missing opponent / score</h1>
      <p className="text-sm text-slate-600">{rows.length} historical games need data.</p>
      <ul className="space-y-1 text-sm">
        {rows.map(({ g, s }) => (
          <li key={g.id}>
            <Link className="text-team underline" href={`/admin/games/${g.id}`}>
              {s.year} #{g.gameNumber} · {fmtDate(g.playedOn)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
