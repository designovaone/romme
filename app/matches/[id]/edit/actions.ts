'use server';

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../../../_lib/actions-helpers';
import {
  deleteMatchSchema,
  editRoundSchema,
} from '../../../_lib/validation';
import { getDb } from '../../../_lib/db';
import { matches, rounds } from '../../../_lib/schema';

export type EditRoundState = { error: string | null } | undefined;

export async function editRound(
  _prev: EditRoundState,
  formData: FormData
): Promise<EditRoundState> {
  await requireSession();

  const parsed = editRoundSchema.safeParse({
    roundId: formData.get('roundId'),
    matchId: formData.get('matchId'),
    leftPoints: formData.get('leftPoints'),
    rightPoints: formData.get('rightPoints'),
    winner: formData.get('winner'),
    dealer: formData.get('dealer'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Ungültige Eingabe.' };
  }
  const { roundId, matchId, leftPoints, rightPoints, winner, dealer } =
    parsed.data;

  const db = getDb();
  const updated = await db
    .update(rounds)
    .set({ leftPoints, rightPoints, winner, dealer })
    .where(and(eq(rounds.id, roundId), eq(rounds.matchId, matchId)))
    .returning({ id: rounds.id });

  if (updated.length === 0) {
    return { error: 'Runde nicht gefunden.' };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}/edit`);
  revalidatePath('/');
  return { error: null };
}

export async function deleteMatch(
  formData: FormData
): Promise<{ error: string } | never> {
  await requireSession();
  const parsed = deleteMatchSchema.safeParse({
    matchId: formData.get('matchId'),
  });
  if (!parsed.success) {
    return { error: 'Match konnte nicht gelöscht werden.' };
  }
  const db = getDb();
  try {
    await db.delete(matches).where(eq(matches.id, parsed.data.matchId));
  } catch {
    return { error: 'Match konnte nicht gelöscht werden.' };
  }
  revalidatePath('/');
  redirect('/');
}
