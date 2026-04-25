import { db } from '@/lib/db';
import { games, battingLines, players, rsvps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { fmtAvg } from '@/lib/utils';
import { fmtDateTime, fmtDate } from '@/lib/format';
import { RsvpControl } from '@/components/RsvpControl';
import { RsvpRoster } from '@/components/RsvpRoster';
import { getPlayer } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const rows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!rows.length) notFound();
  const game = rows[0];

  const me = await getPlayer();

  const lines = await db
    .select({
      id: battingLines.id,
      playerId: battingLines.playerId,
      displayName: players.displayName,
      slug: players.slug,
      gender: players.gender,
      ab: battingLines.ab,
      r: battingLines.r,
      h: battingLines.h,
      singles: battingLines.singles,
      doubles: battingLines.doubles,
      triples: battingLines.triples,
      hr: battingLines.hr,
      rbi: battingLines.rbi,
      bb: battingLines.bb,
      k: battingLines.k,
      sac: battingLines.sac,
    })
    .from(battingLines)
    .innerJoin(players, eq(players.id, battingLines.playerId))
    .where(eq(battingLines.gameId, gameId));

  const rsvpRows = await db
    .select({
      id: rsvps.id,
      status: rsvps.status,
      playerId: rsvps.playerId,
      displayName: players.displayName,
      gender: players.gender,
    })
    .from(rsvps)
    .innerJoin(players, eq(players.id, rsvps.playerId))
    .where(eq(rsvps.gameId, gameId));

  const myRsvp = me ? rsvpRows.find((r) => r.playerId === me.id)?.status ?? null : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">vs {game.opponent ?? 'TBD'}</h1>
        <div className="text-slate-700">{game.startTime ? fmtDateTime(game.startTime) : fmtDate(game.playedOn)}</div>
        {game.location ? <div className="text-sm text-slate-500">{game.location}</div> : null}
        {game.uhjRuns != null && game.oppRuns != null ? (
          <div className="text-2xl font-bold tabular-nums">
            {game.uhjRuns} – {game.oppRuns}
            {game.result ? <span className="ml-2 text-base font-normal text-slate-600">({game.result})</span> : null}
          </div>
        ) : null}
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">RSVP</h2>
        {me ? (
          <RsvpControl gameId={game.id} initial={myRsvp} />
        ) : (
          <div className="text-sm">
            <a className="text-team underline" href={`/login?next=/schedule/${game.id}`}>
              Log in
            </a>{' '}
            to RSVP.
          </div>
        )}
        <div className="mt-4">
          <RsvpRoster
            rsvps={rsvpRows.map((r) => ({
              playerId: r.playerId,
              displayName: r.displayName,
              gender: r.gender as 'M' | 'F',
              status: r.status as 'yes' | 'no' | 'maybe',
            }))}
          />
        </div>
      </section>

      {lines.length ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-600">Batting</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="px-2 py-2 text-left">Player</th>
                  <th className="px-2 py-2">AB</th>
                  <th className="px-2 py-2">R</th>
                  <th className="px-2 py-2">H</th>
                  <th className="px-2 py-2">2B</th>
                  <th className="px-2 py-2">3B</th>
                  <th className="px-2 py-2">HR</th>
                  <th className="px-2 py-2">RBI</th>
                  <th className="px-2 py-2">BB</th>
                  <th className="px-2 py-2">K</th>
                  <th className="px-2 py-2">SAC</th>
                  <th className="px-2 py-2">AVG</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="px-2 py-1.5">{l.displayName}</td>
                    <td className="px-2 py-1.5 text-right">{l.ab}</td>
                    <td className="px-2 py-1.5 text-right">{l.r}</td>
                    <td className="px-2 py-1.5 text-right">{l.h}</td>
                    <td className="px-2 py-1.5 text-right">{l.doubles}</td>
                    <td className="px-2 py-1.5 text-right">{l.triples}</td>
                    <td className="px-2 py-1.5 text-right">{l.hr}</td>
                    <td className="px-2 py-1.5 text-right">{l.rbi}</td>
                    <td className="px-2 py-1.5 text-right">{l.bb}</td>
                    <td className="px-2 py-1.5 text-right">{l.k}</td>
                    <td className="px-2 py-1.5 text-right">{l.sac}</td>
                    <td className="px-2 py-1.5 text-right">{fmtAvg(l.ab ? l.h / l.ab : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
