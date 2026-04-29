import { NextResponse } from 'next/server';
import { getAdminSession, getPlayerSession } from '@/lib/auth/session';

async function clearAndRedirect(req: Request) {
  const p = await getPlayerSession();
  p.destroy();
  const a = await getAdminSession();
  a.destroy();
  return NextResponse.redirect(new URL('/', req.url));
}

export const GET = clearAndRedirect;
export const POST = clearAndRedirect;
