'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminSession, getPlayerSession } from '@/lib/auth/session';
import { LRUCache } from 'lru-cache';

const PlayerSchema = z.object({
  playerId: z.string().uuid(),
  passphrase: z.string().min(1),
  next: z.string().optional(),
});

const AdminSchema = z.object({
  password: z.string().min(1),
  next: z.string().optional(),
});

const adminAttempts = new LRUCache<string, number>({ max: 5000, ttl: 60_000 });

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function loginPlayer(formData: FormData) {
  const args = PlayerSchema.parse({
    playerId: formData.get('playerId'),
    passphrase: formData.get('passphrase'),
    next: formData.get('next') ?? '/',
  });

  const expected = process.env.TEAM_PASSPHRASE;
  if (!expected) throw new Error('TEAM_PASSPHRASE not set');
  if (!constantTimeEqual(args.passphrase, expected)) {
    redirect('/login?error=bad-passphrase');
  }

  const rows = await db.select().from(players).where(eq(players.id, args.playerId)).limit(1);
  if (!rows.length) redirect('/login?error=unknown-player');

  const sess = await getPlayerSession();
  sess.playerId = rows[0].id;
  await sess.save();

  redirect(args.next || '/');
}

export async function loginAdmin(formData: FormData) {
  const args = AdminSchema.parse({
    password: formData.get('password'),
    next: formData.get('next') ?? '/admin',
  });

  // Best-effort IP rate limit. 5/min.
  const ip = (formData.get('_ip') as string) || 'local';
  const tries = (adminAttempts.get(ip) ?? 0) + 1;
  adminAttempts.set(ip, tries);
  if (tries > 5) redirect('/admin/login?error=throttled');

  const hash = process.env.ADMIN_PASSWORD_HASH;
  console.log('[admin login] hash_len=', hash?.length, 'hash_starts=', hash?.slice(0, 10));
  if (!hash) throw new Error('ADMIN_PASSWORD_HASH not set');
  const ok = bcrypt.compareSync(args.password, hash);
  console.log('[admin login] match=', ok, 'pwd_len=', args.password.length);
  if (!ok) redirect('/admin/login?error=bad-password');

  const sess = await getAdminSession();
  sess.admin = true;
  await sess.save();
  redirect(args.next || '/admin');
}

export async function logout() {
  const p = await getPlayerSession();
  p.destroy();
  const a = await getAdminSession();
  a.destroy();
  redirect('/');
}
