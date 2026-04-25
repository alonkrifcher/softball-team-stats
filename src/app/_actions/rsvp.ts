'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { rsvps } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requirePlayer } from '@/lib/auth/guards';

const Schema = z.object({
  gameId: z.string().uuid(),
  status: z.enum(['yes', 'no', 'maybe']),
});

export async function setRsvp(gameId: string, status: 'yes' | 'no' | 'maybe') {
  const me = await requirePlayer();
  const args = Schema.parse({ gameId, status });

  const existing = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.gameId, args.gameId), eq(rsvps.playerId, me.id)))
    .limit(1);

  if (existing.length) {
    await db.update(rsvps).set({ status: args.status, updatedAt: new Date() }).where(eq(rsvps.id, existing[0].id));
  } else {
    await db.insert(rsvps).values({ gameId: args.gameId, playerId: me.id, status: args.status });
  }

  revalidatePath(`/schedule/${args.gameId}`);
  revalidatePath('/');
  return { ok: true };
}
