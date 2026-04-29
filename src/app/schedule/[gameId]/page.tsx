import Link from 'next/link';
import { db } from '@/lib/db';
import { games, battingLines, players, rsvps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { fmtAvg } from '@/lib/utils';
import { fmtDate, fmtTime } from '@/lib/format';
import { RsvpControl } from '@/components/RsvpControl';
import { RsvpRoster } from '@/components/RsvpRoster';
import { getPlayer, getAdmin } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const rows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!rows.length) notFound();
  const game = rows[0];

  const [me, admin] = await Promise.all([getPlayer(), getAdmin()]);

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

  const finalScore = game.uhjRuns != null && game.oppRuns != null;

  return (
    <div className="space-y-6">
      {/* Score header — ESPN style */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-team-dark to-team-deep px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/90">
          {fmtDate(game.playedOn)}
          {game.startTime ? ` · ${fmtTime(game.startTime as unknown as string)}` : ''}
          {game.location ? ` · ${game.location}` : ''}
          {game.status === 'cancelled' ? ' · CANCELLED' : ''}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-6">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">Home</div>
            <div className="text-xl font-bold">Underhand Jobs</div>
          </div>
          <div className="flex flex-col items-center">
            {finalScore ? (
              <>
                <div className="flex items-center gap-3 text-5xl font-black tabular-nums">
                  <span className={game.result === 'W' ? 'text-team-dark' : 'text-slate-400'}>{game.uhjRuns}</span>
                  <span className="text-slate-300">–</span>
                  <span className={game.result === 'L' ? 'text-red-600' : 'text-slate-400'}>{game.oppRuns}</span>
                </div>
                {game.result ? (
                  <span
                    className={
                      'mt-1 rounded px-2 py-0.5 text-xs font-bold ' +
                      (game.result === 'W'
                        ? 'bg-green-600 text-white'
                        : game.result === 'L'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-500 text-white')
                    }
                  >
                    FINAL · {game.result}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="rounded bg-team-accent/20 px-3 py-1.5 text-sm font-bold text-team-dark">UPCOMING</span>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Away</div>
            <div className="text-xl font-bold">{game.opponent ?? 'TBD'}</div>
          </div>
        </div>
        {admin ? (
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs">
            <Link href={`/admin/games/${game.id}`} className="text-team hover:underline">
              Edit game
            </Link>
            <span className="text-slate-300">·</span>
            <Link href={`/admin/games/${game.id}/stats`} className="text-team hover:underline">
              Enter stats
            </Link>
          </div>
        ) : null}
      </section>

      {/* RSVP */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">RSVP</h2>
        {me ? (
          <RsvpControl gameId={game.id} initial={myRsvp} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
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
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Box score</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b-2 border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-2 py-2 text-right">AB</th>
                  <th className="px-2 py-2 text-right">R</th>
                  <th className="px-2 py-2 text-right">H</th>
                  <th className="px-2 py-2 text-right">2B</th>
                  <th className="px-2 py-2 text-right">3B</th>
                  <th className="px-2 py-2 text-right">HR</th>
                  <th className="px-2 py-2 text-right">RBI</th>
                  <th className="px-2 py-2 text-right">BB</th>
                  <th className="px-2 py-2 text-right">K</th>
                  <th className="px-2 py-2 text-right">SAC</th>
                  <th className="px-2 py-2 text-right">AVG</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.id} className={'border-b border-slate-100 last:border-0 hover:bg-team/5 ' + (i % 2 === 1 ? 'bg-slate-50/40' : '')}>
                    <td className="px-3 py-1.5">
                      <Link href={`/players/${l.slug}`} className="font-medium text-team hover:underline">
                        {l.displayName}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.ab}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.r}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.h}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.doubles}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.triples}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.hr}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.rbi}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.bb}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.k}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.sac}</td>
                    <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmtAvg(l.ab ? l.h / l.ab : 0)}</td>
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
