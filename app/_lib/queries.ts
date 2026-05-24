import 'server-only';
import { desc, eq, asc, sql, and } from 'drizzle-orm';
import { getDb } from './db';
import { matches, players, rounds } from './schema';

export type MatchSummary = {
  id: string;
  playedAt: Date;
  status: 'in_progress' | 'complete';
  leftName: string;
  rightName: string;
  leftTotal: number;
  rightTotal: number;
  roundCount: number;
  completedRounds: number;
};

export async function listMatches(): Promise<MatchSummary[]> {
  const db = getDb();
  const lp = { id: players.id, name: players.name };
  const rp = { id: sql<string>`rp.id`, name: sql<string>`rp.name` };
  const rows = await db
    .select({
      id: matches.id,
      playedAt: matches.playedAt,
      status: matches.status,
      roundCount: matches.roundCount,
      leftName: lp.name,
      rightName: rp.name,
      leftTotal: sql<number>`COALESCE(SUM(${rounds.leftPoints}), 0)::int`,
      rightTotal: sql<number>`COALESCE(SUM(${rounds.rightPoints}), 0)::int`,
      completedRounds: sql<number>`COUNT(${rounds.id})::int`,
    })
    .from(matches)
    .innerJoin(players, eq(players.id, matches.leftPlayerId))
    .innerJoin(sql`${players} AS rp`, sql`rp.id = ${matches.rightPlayerId}`)
    .leftJoin(rounds, eq(rounds.matchId, matches.id))
    .groupBy(matches.id, players.id, sql`rp.id`)
    .orderBy(desc(matches.playedAt));

  return rows.map((r) => ({
    id: r.id,
    playedAt: r.playedAt,
    status: r.status as 'in_progress' | 'complete',
    leftName: r.leftName,
    rightName: r.rightName,
    leftTotal: r.leftTotal,
    rightTotal: r.rightTotal,
    roundCount: r.roundCount,
    completedRounds: r.completedRounds,
  }));
}

export type MatchDetail = {
  id: string;
  playedAt: Date;
  status: 'in_progress' | 'complete';
  roundCount: number;
  leftPlayer: { id: string; name: string };
  rightPlayer: { id: string; name: string };
  rounds: Array<{
    id: string;
    roundNumber: number;
    leftPoints: number;
    rightPoints: number;
    winner: 0 | 1;
    dealer: 0 | 1;
  }>;
};

export async function getMatch(id: string): Promise<MatchDetail | null> {
  const db = getDb();
  const matchRows = await db
    .select({
      id: matches.id,
      playedAt: matches.playedAt,
      status: matches.status,
      roundCount: matches.roundCount,
      leftPlayerId: matches.leftPlayerId,
      rightPlayerId: matches.rightPlayerId,
    })
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);

  const m = matchRows[0];
  if (!m) return null;

  const [leftP, rightP] = await Promise.all([
    db.select().from(players).where(eq(players.id, m.leftPlayerId)).limit(1),
    db.select().from(players).where(eq(players.id, m.rightPlayerId)).limit(1),
  ]);

  const rds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.matchId, id))
    .orderBy(asc(rounds.roundNumber));

  return {
    id: m.id,
    playedAt: m.playedAt,
    status: m.status as 'in_progress' | 'complete',
    roundCount: m.roundCount,
    leftPlayer: { id: leftP[0].id, name: leftP[0].name },
    rightPlayer: { id: rightP[0].id, name: rightP[0].name },
    rounds: rds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      leftPoints: r.leftPoints,
      rightPoints: r.rightPoints,
      winner: r.winner as 0 | 1,
      dealer: r.dealer as 0 | 1,
    })),
  };
}

export async function getLastUsedPlayerPair(): Promise<{
  left: string;
  right: string;
}> {
  const db = getDb();
  const rows = await db
    .select({
      leftName: players.name,
      rightName: sql<string>`rp.name`,
    })
    .from(matches)
    .innerJoin(players, eq(players.id, matches.leftPlayerId))
    .innerJoin(sql`${players} AS rp`, sql`rp.id = ${matches.rightPlayerId}`)
    .orderBy(desc(matches.playedAt))
    .limit(1);
  if (rows[0]) return { left: rows[0].leftName, right: rows[0].rightName };
  return { left: 'Richard', right: 'Andrea' };
}

export async function upsertPlayer(name: string): Promise<string> {
  const db = getDb();
  const trimmedName = name.trim();
  const existing = await db
    .select({ id: players.id })
    .from(players)
    .where(sql`lower(${players.name}) = lower(${trimmedName})`)
    .limit(1);
  if (existing[0]) return existing[0].id;
  const inserted = await db
    .insert(players)
    .values({ name: trimmedName })
    .returning({ id: players.id });
  return inserted[0].id;
}

export { and };
