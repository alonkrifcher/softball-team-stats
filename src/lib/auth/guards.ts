import { redirect } from 'next/navigation';
import { getAdminSession, getPlayerSession } from './session';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getPlayer() {
  const s = await getPlayerSession();
  if (!s.playerId) return null;
  const rows = await db.select().from(players).where(eq(players.id, s.playerId)).limit(1);
  return rows[0] ?? null;
}

export async function requirePlayer(redirectTo = '/login') {
  const p = await getPlayer();
  if (!p) redirect(redirectTo);
  return p;
}

export async function getAdmin() {
  const s = await getAdminSession();
  return s.admin ? { admin: true as const } : null;
}

export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect('/admin/login');
  return a;
}
