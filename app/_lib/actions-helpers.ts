import 'server-only';
import { redirect } from 'next/navigation';
import { verifySession } from './dal';

export async function requireSession(): Promise<void> {
  const session = await verifySession();
  if (!session.valid) {
    redirect('/login');
  }
}

// Blank/absent joker count → null (not recorded). We normalize here rather
// than leaning on Zod coercion, which would silently turn '' into 0.
export function jokerCount(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : Number(s);
}
