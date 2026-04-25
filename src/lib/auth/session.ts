import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';

export type PlayerSession = { playerId?: string };
export type AdminSession = { admin?: true };

export const PLAYER_COOKIE = 'uhj_player';
export const ADMIN_COOKIE = 'uhj_admin';

function playerOpts(): SessionOptions {
  const password = process.env.PLAYER_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error('PLAYER_SESSION_SECRET must be at least 32 chars');
  }
  return {
    password,
    cookieName: PLAYER_COOKIE,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90,
    },
  };
}

function adminOpts(): SessionOptions {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 chars');
  }
  return {
    password,
    cookieName: ADMIN_COOKIE,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getPlayerSession() {
  return getIronSession<PlayerSession>(await cookies(), playerOpts());
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), adminOpts());
}
