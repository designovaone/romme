import 'server-only';
import crypto from 'node:crypto';

export const SESSION_COOKIE = 'romme_session';
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

type SessionPayload = {
  exp: number;
  nonce: string;
};

function getSecret(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return Buffer.from(secret, 'base64');
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

function hmac(payload: string, key: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(payload).digest();
}

export function signSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(Buffer.from(json, 'utf8'));
  const sig = hmac(payloadB64, getSecret());
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let providedSig: Buffer;
  try {
    providedSig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expectedSig = hmac(payloadB64, getSecret());
  if (providedSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(providedSig, expectedSig)) return null;

  let payload: SessionPayload;
  try {
    const json = b64urlDecode(payloadB64).toString('utf8');
    payload = JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number') return null;
  if (Date.now() / 1000 > payload.exp) return null;
  return payload;
}

export function createSessionToken(): { token: string; expSeconds: number } {
  const expSeconds = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const nonce = crypto.randomBytes(24).toString('base64url');
  const token = signSession({ exp: expSeconds, nonce });
  return { token, expSeconds };
}
