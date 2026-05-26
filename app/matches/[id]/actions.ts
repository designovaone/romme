'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '../../_lib/actions-helpers';
import {
  submitRoundSchema,
  deleteMatchSchema,
  matchExtrasSchema,
} from '../../_lib/validation';
import { getDb } from '../../_lib/db';
import { matches, rounds } from '../../_lib/schema';

export type SubmitRoundState = { error: string | null } | undefined;

export async function submitRound(
  _prev: SubmitRoundState,
  formData: FormData
): Promise<SubmitRoundState> {
  await requireSession();

  const parsed = submitRoundSchema.safeParse({
    matchId: formData.get('matchId'),
    roundNumber: formData.get('roundNumber'),
    leftPoints: formData.get('leftPoints'),
    rightPoints: formData.get('rightPoints'),
    winner: formData.get('winner'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Ungültige Eingabe.' };
  }

  const { matchId, roundNumber, leftPoints, rightPoints, winner } = parsed.data;
  const db = getDb();
  const matchRows = await db
    .select({ roundCount: matches.roundCount, status: matches.status })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  const m = matchRows[0];
  if (!m) return { error: 'Spiel nicht gefunden.' };
  if (m.status === 'complete') return { error: 'Spiel ist bereits beendet.' };
  if (roundNumber > m.roundCount) {
    return { error: 'Rundenzahl überschreitet das Spielmaximum.' };
  }

  const dealer = ((roundNumber - 1) % 2) as 0 | 1;

  try {
    await db.insert(rounds).values({
      matchId,
      roundNumber,
      leftPoints,
      rightPoints,
      winner,
      dealer,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('rounds_match_round_uniq') || msg.includes('duplicate')) {
      return {
        error:
          'Diese Runde wurde bereits gespeichert. Bitte Seite neu laden.',
      };
    }
    return { error: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' };
  }

  if (roundNumber === m.roundCount) {
    await db
      .update(matches)
      .set({ status: 'complete' })
      .where(eq(matches.id, matchId));
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath('/');
  return { error: null };
}

// Blank/absent count field → null (not recorded). We normalize here rather
// than leaning on Zod coercion, which would silently turn '' into 0.
function jokerCount(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : Number(s);
}

export async function updateMatchExtras(
  formData: FormData
): Promise<{ error: string | null }> {
  await requireSession();

  const parsed = matchExtrasSchema.safeParse({
    matchId: formData.get('matchId'),
    startJoker: formData.get('startJoker'),
    leftJokers: jokerCount(formData.get('leftJokers')),
    rightJokers: jokerCount(formData.get('rightJokers')),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Ungültige Eingabe.' };
  }

  const { matchId, startJoker, leftJokers, rightJokers } = parsed.data;
  const db = getDb();
  const updated = await db
    .update(matches)
    .set({ startJoker, leftJokers, rightJokers })
    .where(eq(matches.id, matchId))
    .returning({ id: matches.id });
  if (updated.length === 0) return { error: 'Spiel nicht gefunden.' };

  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}/edit`);
  revalidatePath('/');
  return { error: null };
}

export async function discardMatch(
  formData: FormData
): Promise<{ error: string } | never> {
  await requireSession();
  const parsed = deleteMatchSchema.safeParse({
    matchId: formData.get('matchId'),
  });
  if (!parsed.success) {
    return { error: 'Spiel konnte nicht verworfen werden.' };
  }
  const db = getDb();
  try {
    await db.delete(matches).where(eq(matches.id, parsed.data.matchId));
  } catch {
    return { error: 'Spiel konnte nicht verworfen werden.' };
  }
  revalidatePath('/');
  redirect('/');
}
