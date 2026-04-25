import { db } from '@/lib/db';
import { games, players, scoresheetUploads } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { signedUrlForDownload } from '@/lib/storage';
import { ScoresheetReview } from '@/components/ScoresheetReview';
import { ScoresheetSchema } from '@/lib/ocr';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ gameId: string; uploadId: string }> }) {
  const { gameId, uploadId } = await params;
  const [up] = await db.select().from(scoresheetUploads).where(eq(scoresheetUploads.id, uploadId)).limit(1);
  if (!up) notFound();
  const [g] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!g) notFound();

  const roster = await db
    .select({ id: players.id, slug: players.slug, displayName: players.displayName, gender: players.gender })
    .from(players)
    .where(eq(players.active, true))
    .orderBy(asc(players.displayName));

  const imageUrl = await signedUrlForDownload(up.storageKey);

  let parsed = null;
  if (up.parsedJson) {
    const result = ScoresheetSchema.safeParse(up.parsedJson);
    parsed = result.success ? result.data : null;
  }

  return (
    <ScoresheetReview
      uploadId={up.id}
      gameId={gameId}
      status={up.status}
      errorMessage={up.errorMessage}
      imageUrl={imageUrl}
      initialParsed={parsed}
      initialMeta={{
        opponent: g.opponent ?? '',
        uhjRuns: g.uhjRuns ?? null,
        oppRuns: g.oppRuns ?? null,
      }}
      roster={roster.map((r) => ({ ...r, gender: r.gender as 'M' | 'F' }))}
    />
  );
}
