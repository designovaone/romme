'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../../_lib/actions-helpers';
import { createMatchSchema } from '../../_lib/validation';
import { getDb } from '../../_lib/db';
import { matches } from '../../_lib/schema';
import { upsertPlayer } from '../../_lib/queries';

export type CreateMatchState = { error: string | null } | undefined;

export async function createMatch(
  _prev: CreateMatchState,
  formData: FormData
): Promise<CreateMatchState> {
  await requireSession();

  const parsed = createMatchSchema.safeParse({
    leftPlayer: formData.get('leftPlayer'),
    rightPlayer: formData.get('rightPlayer'),
    roundCount: formData.get('roundCount'),
    playedAt: formData.get('playedAt'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Ungültige Eingabe.' };
  }

  const { leftPlayer, rightPlayer, roundCount, playedAt } = parsed.data;
  const [leftId, rightId] = await Promise.all([
    upsertPlayer(leftPlayer),
    upsertPlayer(rightPlayer),
  ]);

  if (leftId === rightId) {
    return { error: 'Beide Spielernamen müssen unterschiedlich sein.' };
  }

  const db = getDb();
  const inserted = await db
    .insert(matches)
    .values({
      leftPlayerId: leftId,
      rightPlayerId: rightId,
      roundCount,
      playedAt: new Date(playedAt),
      status: 'in_progress',
    })
    .returning({ id: matches.id });

  revalidatePath('/');
  redirect(`/matches/${inserted[0].id}`);
}
