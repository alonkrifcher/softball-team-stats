import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';

const ADMIN_COOKIE = 'uhj_admin';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/admin') && path !== '/admin/login') {
    const password = process.env.ADMIN_SESSION_SECRET;
    if (!password || password.length < 32) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    const res = NextResponse.next();
    const session = await getIronSession<{ admin?: true }>(req, res, {
      password,
      cookieName: ADMIN_COOKIE,
    });
    if (!session.admin) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
