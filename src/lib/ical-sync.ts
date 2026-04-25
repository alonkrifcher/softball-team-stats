import 'server-only';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { fetchIcal } from '@/lib/ical';
import { logAudit } from '@/lib/audit';
import { unstable_cache } from 'next/cache';

export async function syncSeasonIcal(seasonId: string, icalUrl: string) {
  const events = await fetchIcal(icalUrl);
  const seenUids: string[] = [];
  let added = 0;
  let updated = 0;
  let cancelled = 0;

  for (const ev of events) {
    seenUids.push(ev.uid);
    const dateStr = ev.start.toISOString().slice(0, 10);
    const existing = await db.select().from(games).where(eq(games.icalUid, ev.uid)).limit(1);
    if (existing.length) {
      if (existing[0].status === 'scheduled') {
        await db
          .update(games)
          .set({
            playedOn: dateStr,
            startTime: ev.start,
            opponent: ev.opponent ?? existing[0].opponent ?? null,
            location: ev.location ?? existing[0].location ?? null,
            updatedAt: new Date(),
          })
          .where(eq(games.id, existing[0].id));
        updated++;
      }
    } else {
      await db.insert(games).values({
        seasonId,
        playedOn: dateStr,
        startTime: ev.start,
        opponent: ev.opponent ?? null,
        location: ev.location ?? null,
        icalUid: ev.uid,
        status: 'scheduled',
      });
      added++;
    }
  }

  // Mark scheduled games not in feed as cancelled
  const seasonGames = await db.select().from(games).where(eq(games.seasonId, seasonId));
  for (const g of seasonGames) {
    if (g.status === 'scheduled' && g.icalUid && !seenUids.includes(g.icalUid)) {
      await db.update(games).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(games.id, g.id));
      cancelled++;
    }
  }

  await logAudit('admin', 'sync_ical', seasonId, { added, updated, cancelled, total: events.length });
  return { added, updated, cancelled };
}

export const syncSeasonIcalCached = unstable_cache(
  async (seasonId: string, icalUrl: string) => syncSeasonIcal(seasonId, icalUrl),
  ['sync-season-ical'],
  { revalidate: 600, tags: ['games'] }
);
