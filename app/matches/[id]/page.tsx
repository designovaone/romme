import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { verifySession } from '../../_lib/dal';
import { getMatch } from '../../_lib/queries';
import { formatDateTime, initialOf } from '../../_lib/format';
import { MatchClient } from './MatchClient';

type Params = { id: string };

export default async function MatchPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await verifySession();
  if (!session.valid) redirect('/login');

  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  if (match.status === 'in_progress') {
    return <MatchClient match={match} />;
  }

  return <CompleteView match={match} />;
}

function CompleteView({
  match,
}: {
  match: NonNullable<Awaited<ReturnType<typeof getMatch>>>;
}) {
  const leftTotal = match.rounds.reduce((s, r) => s + r.leftPoints, 0);
  const rightTotal = match.rounds.reduce((s, r) => s + r.rightPoints, 0);
  const leftWins = leftTotal < rightTotal;
  const tied = leftTotal === rightTotal;
  const winnerName = tied
    ? null
    : leftWins
      ? match.leftPlayer.name
      : match.rightPlayer.name;

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400">
          ← Zurück
        </Link>
        <h1 className="text-lg font-medium">Spiel</h1>
        <Link
          href={`/matches/${match.id}/edit`}
          className="text-sm text-[var(--accent)]"
        >
          Bearbeiten
        </Link>
      </header>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDateTime(match.playedAt)}
        </div>
        <div className="text-xl">
          {match.leftPlayer.name} vs. {match.rightPlayer.name}
        </div>
        {winnerName ? (
          <div className="text-base">
            Gewinner: <span className="font-semibold">{winnerName}</span>
          </div>
        ) : (
          <div className="text-base">Unentschieden</div>
        )}

        {match.startJoker !== null ||
        match.leftJokers !== null ||
        match.rightJokers !== null ? (
          <div className="flex flex-col gap-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {match.startJoker !== null ? (
              <span>
                Start-Joker:{' '}
                <span className="font-medium text-[var(--foreground)]">
                  {match.startJoker === 0
                    ? match.leftPlayer.name
                    : match.rightPlayer.name}
                </span>
              </span>
            ) : null}
            {match.leftJokers !== null || match.rightJokers !== null ? (
              <span className="tabular-nums">
                Joker erhalten: {match.leftPlayer.name} {match.leftJokers ?? '—'}{' '}
                · {match.rightPlayer.name} {match.rightJokers ?? '—'}
              </span>
            ) : null}
          </div>
        ) : null}

        <table className="w-full mt-4 font-mono tabular-nums text-xl border-collapse">
          <thead>
            <tr className="text-sm text-zinc-500 dark:text-zinc-400">
              <th className="text-left py-2 w-10">#</th>
              <th className="text-right py-2">{match.leftPlayer.name}</th>
              <th className="text-right py-2">{match.rightPlayer.name}</th>
            </tr>
          </thead>
          <tbody>
            {match.rounds.map((r) => (
              <tr key={r.id} className="border-t border-[var(--border)]">
                <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {r.roundNumber}
                </td>
                <td className="py-3 text-right">
                  {r.dealer === 0 ? <DealerMark name={match.leftPlayer.name} /> : null}
                  {r.leftPoints}
                </td>
                <td className="py-3 text-right">
                  {r.dealer === 1 ? <DealerMark name={match.rightPlayer.name} /> : null}
                  {r.rightPoints}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-[var(--foreground)]">
              <td className="py-3 text-sm">Σ</td>
              <td className="py-3 text-right font-semibold">{leftTotal}</td>
              <td className="py-3 text-right font-semibold">{rightTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}

function DealerMark({ name }: { name: string }) {
  return (
    <span
      aria-label={`Geber: ${name}`}
      title={`Geber: ${name}`}
      className="inline-flex items-center justify-center mr-2 text-[0.7em] border border-current rounded-full w-5 h-5 align-middle"
    >
      {initialOf(name)}
    </span>
  );
}
