import 'server-only';
import { redirect } from 'next/navigation';
import { verifySession } from './dal';

export async function requireSession(): Promise<void> {
  const session = await verifySession();
  if (!session.valid) {
    redirect('/login');
  }
}
