import { z } from 'zod';

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const createMatchSchema = z
  .object({
    leftPlayer: z.string().trim().min(1).max(40),
    rightPlayer: z.string().trim().min(1).max(40),
    roundCount: z.union([z.literal(3), z.literal(5), z.literal(10)]),
    playedAt: z.iso.datetime(),
  })
  .refine(
    (d) => d.leftPlayer.toLowerCase() !== d.rightPlayer.toLowerCase(),
    { message: 'Beide Spielernamen müssen unterschiedlich sein.' }
  );

export const submitRoundSchema = z
  .object({
    matchId: z.uuid(),
    roundNumber: z.coerce.number().int().min(1).max(10),
    leftPoints: z.coerce.number().int().min(0).max(500),
    rightPoints: z.coerce.number().int().min(0).max(500),
    winner: z.coerce.number().int().min(0).max(1),
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
  })
  .refine(
    (d) => (d.winner === 0 ? d.leftPoints === 0 : d.rightPoints === 0),
    { message: 'Der Sieger muss 0 Punkte haben.' }
  );

export const deleteMatchSchema = z.object({
  matchId: z.uuid(),
});
