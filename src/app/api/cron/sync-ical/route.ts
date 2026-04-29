import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { syncSeasonIcal } from '@/lib/ical-sync';

export const dynamic = 'force-dynamic';

// Triggered by Vercel Cron (daily) or by anyone with the secret. Vercel sets
// `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET is in
// the project env. Manual hits without the bearer are rejected.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const current = await db.select().from(seasons).where(eq(seasons.isCurrent, true));
  const results: Array<{ seasonId: string; year: number; added: number; updated: number; cancelled: number; error?: string }> = [];

  for (const s of current) {
    if (!s.icalUrl) continue;
    try {
      const r = await syncSeasonIcal(s.id, s.icalUrl);
      results.push({ seasonId: s.id, year: s.year, ...r });
    } catch (e) {
      results.push({
        seasonId: s.id,
        year: s.year,
        added: 0,
        updated: 0,
        cancelled: 0,
        error: (e as Error).message,
      });
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results });
}
