import { z } from 'zod';

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const createMatchSchema = z
  .object({
    leftPlayer: z.string().trim().min(1).max(40),
    rightPlayer: z.string().trim().min(1).max(40),
    roundCount: z.coerce.number().int().min(1).max(99),
    playedAt: z.iso.datetime(),
  })
  .refine(
    (d) => d.leftPlayer.toLowerCase() !== d.rightPlayer.toLowerCase(),
    { message: 'Beide Spielernamen müssen unterschiedlich sein.' }
  );

// Jokers each player received this round (left_jokers/right_jokers). Optional:
// the caller normalizes blank/absent → null before parsing, so '' never
// coerces to 0.
const roundJokers = {
  leftJokers: z.number().int().min(0).max(99).nullable(),
  rightJokers: z.number().int().min(0).max(99).nullable(),
};

export const submitRoundSchema = z
  .object({
    matchId: z.uuid(),
    roundNumber: z.coerce.number().int().min(1).max(99),
    leftPoints: z.coerce.number().int().min(0).max(500),
    rightPoints: z.coerce.number().int().min(0).max(500),
    winner: z.coerce.number().int().min(0).max(1),
    ...roundJokers,
  })
  .refine(
    (d) => (d.winner === 0 ? d.leftPoints === 0 : d.rightPoints === 0),
    { message: 'Der Sieger muss 0 Punkte haben.' }
  );

export const editRoundSchema = z
  .object({
    roundId: z.uuid(),
    matchId: z.uuid(),
    leftPoints: z.coerce.number().int().min(0).max(500),
    rightPoints: z.coerce.number().int().min(0).max(500),
    winner: z.coerce.number().int().min(0).max(1),
    dealer: z.coerce.number().int().min(0).max(1),
    ...roundJokers,
  })
  .refine(
    (d) => (d.winner === 0 ? d.leftPoints === 0 : d.rightPoints === 0),
    { message: 'Der Sieger muss 0 Punkte haben.' }
  );

export const deleteMatchSchema = z.object({
  matchId: z.uuid(),
});

// Match-level joker tracking: only the start joker (who lifted a joker off the
// stack at the start). Per-player joker counts are now per-round (see
// roundJokers above) and accumulate across the match.
export const matchExtrasSchema = z.object({
  matchId: z.uuid(),
  startJoker: z
    .enum(['none', 'left', 'right'])
    .transform((v) => (v === 'left' ? 0 : v === 'right' ? 1 : null)),
});
