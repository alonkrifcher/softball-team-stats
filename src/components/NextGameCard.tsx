import Link from 'next/link';
import { fmtDateTime } from '@/lib/format';

type Game = {
  id: string;
  playedOn: string;
  startTime: Date | string | null;
  opponent: string | null;
  location: string | null;
};

export function NextGameCard({ game }: { game: Game | null }) {
  if (!game) {
    return (
      <div className="card text-slate-500">No upcoming games scheduled.</div>
    );
  }
  return (
    <div className="card flex flex-col gap-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">Next Game</div>
      <div className="text-lg font-semibold">
        vs {game.opponent ?? 'TBD'}
      </div>
      <div className="text-slate-700">
        {game.startTime ? fmtDateTime(game.startTime) : game.playedOn}
      </div>
      {game.location ? <div className="text-sm text-slate-500">{game.location}</div> : null}
      <Link href={`/schedule/${game.id}`} className="btn mt-2 w-fit">
        Open game / RSVP
      </Link>
    </div>
  );
}
