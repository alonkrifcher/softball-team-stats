import { db } from '@/lib/db';
import { battingLines, games, players } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BattingForm } from '@/components/BattingForm';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function GameStatsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const gRows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!gRows.length) notFound();
  const g = gRows[0];

  const roster = await db
    .select({ id: players.id, displayName: players.displayName, gender: players.gender, slug: players.slug })
    .from(players)
    .where(eq(players.active, true))
    .orderBy(asc(players.displayName));

  const lines = await db.select().from(battingLines).where(eq(battingLines.gameId, gameId));
  const initial: Record<string, Record<string, number>> = {};
  for (const l of lines) {
    initial[l.playerId] = {
      ab: l.ab,
      r: l.r,
      h: l.h,
      singles: l.singles,
      doubles: l.doubles,
      triples: l.triples,
      hr: l.hr,
      rbi: l.rbi,
      bb: l.bb,
      k: l.k,
      sac: l.sac,
    };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">
        Stats — {fmtDate(g.playedOn)} vs {g.opponent ?? 'TBD'}
      </h1>
      <BattingForm
        gameId={gameId}
        roster={roster.map((p) => ({ ...p, gender: p.gender as 'M' | 'F' }))}
        initial={initial as Record<string, Partial<{ ab: number }>>}
      />
    </div>
  );
}
