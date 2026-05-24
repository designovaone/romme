'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from '../_lib/validation';
import { verifyPassword, isRateLimited, clearRateLimit } from '../_lib/auth';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '../_lib/session';

export type LoginState = { error: string | null } | undefined;

async function getIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim();
  return ip || 'unknown';
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getIp();
  if (isRateLimited(ip)) {
    await new Promise((r) => setTimeout(r, 1000));
    return { error: 'Zu viele Versuche. Bitte warte 15 Minuten.' };
  }

  const parsed = loginSchema.safeParse({
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Falsches Passwort.' };
  }

  if (!verifyPassword(parsed.data.password)) {
    await new Promise((r) => setTimeout(r, 1000));
    return { error: 'Falsches Passwort.' };
  }

  clearRateLimit(ip);

  const { token } = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect('/');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  redirect('/login');
}
