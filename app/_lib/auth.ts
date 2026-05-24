import 'server-only';
import crypto from 'node:crypto';

function sha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = sha256(input);
  const b = sha256(expected);
  return crypto.timingSafeEqual(a, b);
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type Bucket = { count: number; firstAt: number };
const buckets = new Map<string, Bucket>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.firstAt > WINDOW_MS) {
    buckets.set(ip, { count: 1, firstAt: now });
    return false;
  }
  b.count += 1;
  return b.count > MAX_ATTEMPTS;
}

export function clearRateLimit(ip: string): void {
  buckets.delete(ip);
}
