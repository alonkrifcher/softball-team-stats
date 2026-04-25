import Link from 'next/link';
import { db } from '@/lib/db';
import { games, scoresheetUploads } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { ingestScoresheet } from '@/app/_actions/admin';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ScoresheetIndex({ params }: { params: Promise<{ gameId: string }> }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    notFound();
  }
  const { gameId } = await params;
  const gRows = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!gRows.length) notFound();
  const g = gRows[0];

  const uploads = await db
    .select()
    .from(scoresheetUploads)
    .where(eq(scoresheetUploads.gameId, gameId))
    .orderBy(desc(scoresheetUploads.uploadedAt));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">
        Scoresheet — {fmtDate(g.playedOn)} vs {g.opponent ?? 'TBD'}
      </h1>
      <form
        className="card space-y-3"
        action={async (fd: FormData) => {
          'use server';
          const id = await ingestScoresheet(fd);
          redirect(`/admin/games/${gameId}/scoresheet/${id}`);
        }}
      >
        <input type="hidden" name="gameId" value={gameId} />
        <div>
          <label className="label">Photo</label>
          <input className="input" type="file" name="file" accept="image/*" required />
          <p className="mt-1 text-xs text-slate-500">JPG/PNG/WebP. Recommended: shoot in good light, fill the frame.</p>
        </div>
        <button className="btn">Upload + parse</button>
      </form>

      <h2 className="text-sm font-semibold uppercase text-slate-600">Past uploads</h2>
      <ul className="space-y-1 text-sm">
        {uploads.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/games/${gameId}/scoresheet/${u.id}`} className="text-team underline">
              {u.id.slice(0, 8)}
            </Link>{' '}
            · {u.status} · {new Date(u.uploadedAt).toLocaleString()}
          </li>
        ))}
        {uploads.length === 0 ? <li className="text-slate-400">None.</li> : null}
      </ul>
    </div>
  );
}
