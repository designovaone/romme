import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  integer,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    playedAt: timestamp('played_at', { withTimezone: true }).notNull(),
    leftPlayerId: uuid('left_player_id')
      .notNull()
      .references(() => players.id),
    rightPlayerId: uuid('right_player_id')
      .notNull()
      .references(() => players.id),
    roundCount: smallint('round_count').notNull(),
    status: text('status').notNull().default('in_progress'),
    // Who drew the joker when lifting the stack at the start of the match.
    // NULL = nobody (the default; drawing a joker is the exception), 0 = left
    // player, 1 = right player. Lets us later ask: does the start joker
    // correlate with winning?
    startJoker: smallint('start_joker'),
  },
  (t) => [
    index('matches_played_at_idx').on(t.playedAt.desc()),
    check(
      'matches_round_count_chk',
      sql`${t.roundCount} >= 1 AND ${t.roundCount} <= 99`
    ),
    check(
      'matches_status_chk',
      sql`${t.status} IN ('in_progress', 'complete')`
    ),
    check('matches_distinct_players_chk', sql`${t.leftPlayerId} <> ${t.rightPlayerId}`),
    // NULL passes this CHECK (NULL IN (..) is unknown, not false), so the
    // nullable "not recorded" state is preserved.
    check('matches_start_joker_chk', sql`${t.startJoker} IN (0, 1)`),
  ]
);

export const rounds = pgTable(
  'rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    roundNumber: smallint('round_number').notNull(),
    leftPoints: integer('left_points').notNull(),
    rightPoints: integer('right_points').notNull(),
    winner: smallint('winner').notNull(),
    dealer: smallint('dealer').notNull(),
    // Optional jokers each player received this round. NULL = not recorded
    // (left blank); the match total is the SUM across rounds, so jokers
    // accumulate game by game instead of being one match-level figure.
    leftJokers: smallint('left_jokers'),
    rightJokers: smallint('right_jokers'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('rounds_match_round_uniq').on(t.matchId, t.roundNumber),
    index('rounds_match_idx').on(t.matchId),
    check(
      'rounds_left_points_chk',
      sql`${t.leftPoints} >= 0 AND ${t.leftPoints} <= 500`
    ),
    check(
      'rounds_right_points_chk',
      sql`${t.rightPoints} >= 0 AND ${t.rightPoints} <= 500`
    ),
    check('rounds_winner_chk', sql`${t.winner} IN (0, 1)`),
    check('rounds_dealer_chk', sql`${t.dealer} IN (0, 1)`),
    // NULL passes these CHECKs by design (preserves the "not recorded" state).
    check(
      'rounds_left_jokers_chk',
      sql`${t.leftJokers} >= 0 AND ${t.leftJokers} <= 99`
    ),
    check(
      'rounds_right_jokers_chk',
      sql`${t.rightJokers} >= 0 AND ${t.rightJokers} <= 99`
    ),
  ]
);

export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Round = typeof rounds.$inferSelect;
