import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './session';

export type SessionState = { valid: boolean; exp: number | null };

export const verifySession = cache(async (): Promise<SessionState> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return { valid: false, exp: null };
  return { valid: true, exp: payload.exp };
});
