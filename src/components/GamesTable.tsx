import Link from 'next/link';
import { fmtDateTime, fmtDate } from '@/lib/format';

type Game = {
  id: string;
  playedOn: string;
  startTime: Date | string | null;
  opponent: string | null;
  uhjRuns: number | null;
  oppRuns: number | null;
  result: 'W' | 'L' | 'T' | null;
  status: 'scheduled' | 'final' | 'historical' | 'cancelled';
  location: string | null;
};

export function GamesTable({ games }: { games: Game[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-slate-300">
          <tr>
            <th className="px-2 py-2 text-left">Date</th>
            <th className="px-2 py-2 text-left">Opponent</th>
            <th className="px-2 py-2 text-left">Location</th>
            <th className="px-2 py-2 text-right">Score</th>
            <th className="px-2 py-2 text-right">Result</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-2 py-2">
                <Link href={`/schedule/${g.id}`} className="text-team hover:underline">
                  {g.startTime ? fmtDateTime(g.startTime) : fmtDate(g.playedOn)}
                </Link>
              </td>
              <td className="px-2 py-2">{g.opponent ?? '—'}</td>
              <td className="px-2 py-2 text-slate-600">{g.location ?? '—'}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {g.uhjRuns != null && g.oppRuns != null ? `${g.uhjRuns}–${g.oppRuns}` : '—'}
              </td>
              <td className="px-2 py-2 text-right">
                {g.result ? (
                  <span
                    className={
                      g.result === 'W'
                        ? 'rounded bg-green-100 px-2 py-0.5 text-green-700'
                        : g.result === 'L'
                          ? 'rounded bg-red-100 px-2 py-0.5 text-red-700'
                          : 'rounded bg-slate-100 px-2 py-0.5 text-slate-700'
                    }
                  >
                    {g.result}
                  </span>
                ) : g.status === 'cancelled' ? (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-500">canceled</span>
                ) : (
                  <span className="text-slate-400">scheduled</span>
                )}
              </td>
            </tr>
          ))}
          {games.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-2 py-6 text-center text-slate-400">
                No games yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
