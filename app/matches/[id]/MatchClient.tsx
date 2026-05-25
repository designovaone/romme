'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitRound } from './actions';
import { Button } from '../../_components/Button';
import { NumberInput } from '../../_components/NumberInput';
import { initialOf } from '../../_lib/format';

type Match = {
  id: string;
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

export function MatchClient({ match }: { match: Match }) {
  const router = useRouter();
  const nextRoundNumber = match.rounds.length + 1;
  const dealer: 0 | 1 = ((nextRoundNumber - 1) % 2) as 0 | 1;
  const dealerName = dealer === 0 ? match.leftPlayer.name : match.rightPlayer.name;

  const [leftPoints, setLeftPoints] = useState('');
  const [rightPoints, setRightPoints] = useState('');
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Rommé scoring: the round winner goes out with 0 points; the loser tallies
  // the cards left in hand. So the recorder only enters the loser's points —
  // the other player (0) is automatically the winner. We derive the winner
  // from whichever side has points; entering a score auto-clears the other
  // side so exactly one loser is recorded per round.
  const lpNum = leftPoints === '' ? 0 : Number(leftPoints);
  const rpNum = rightPoints === '' ? 0 : Number(rightPoints);
  const winner: 0 | 1 | null =
    lpNum === 0 && rpNum > 0 ? 0 : rpNum === 0 && lpNum > 0 ? 1 : null;
  const winnerName =
    winner === 0 ? match.leftPlayer.name : winner === 1 ? match.rightPlayer.name : null;
  const canSubmit = winner !== null;

  function onLeftChange(v: string) {
    setLeftPoints(v);
    if (v !== '' && Number(v) > 0) setRightPoints('');
  }
  function onRightChange(v: string) {
    setRightPoints(v);
    if (v !== '' && Number(v) > 0) setLeftPoints('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (winner === null) return;
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await submitRound({ error: null }, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setLeftPoints('');
      setRightPoints('');
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      try {
        navigator.vibrate?.(15);
      } catch {
        // ignore
      }
      router.refresh();
    });
  }

  const previous = [...match.rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <main className={`min-h-dvh flex flex-col ${flash ? 'flash' : ''}`}>
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)]">
        <header className="flex items-center justify-between p-3">
          <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400">
            ← Zurück
          </Link>
          <div className="text-sm font-medium">
            {match.leftPlayer.name} ↔ {match.rightPlayer.name}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
            Runde {nextRoundNumber}/{match.roundCount}
          </div>
        </header>
        <div className="px-3 pb-2 text-xs flex items-center justify-between gap-3">
          <span className="text-zinc-600 dark:text-zinc-400">
            Geber: <span className="font-medium">{dealerName}</span>
          </span>
          <span className="italic text-zinc-500 dark:text-zinc-400">
            Vor Spielbeginn: 1 Karte ziehen — bei Joker behalten.
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col gap-4"
      >
        <input type="hidden" name="matchId" value={match.id} />
        <input type="hidden" name="roundNumber" value={nextRoundNumber} />
        <input type="hidden" name="winner" value={winner ?? ''} />
        <input type="hidden" name="leftPoints" value={String(lpNum)} />
        <input type="hidden" name="rightPoints" value={String(rpNum)} />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Punkte des Verlierers eintragen — der andere Spieler gewinnt die Runde
          mit 0.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">
                {match.leftPlayer.name}
              </span>
              {winner === 0 ? (
                <span className="text-[var(--accent)] font-semibold normal-case tracking-normal">
                  Gewinner
                </span>
              ) : null}
            </span>
            <NumberInput
              value={leftPoints}
              onValueChange={onLeftChange}
              placeholder="0"
              className={winner === 0 ? 'border-[var(--accent)]' : ''}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">
                {match.rightPlayer.name}
              </span>
              {winner === 1 ? (
                <span className="text-[var(--accent)] font-semibold normal-case tracking-normal">
                  Gewinner
                </span>
              ) : null}
            </span>
            <NumberInput
              value={rightPoints}
              onValueChange={onRightChange}
              placeholder="0"
              className={winner === 1 ? 'border-[var(--accent)]' : ''}
            />
          </label>
        </div>

        {winnerName ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Gewinner dieser Runde:{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {winnerName}
            </span>
          </p>
        ) : null}

        {error ? (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending || !canSubmit} fullWidth>
          {pending ? 'Speichere…' : 'Runde speichern'}
        </Button>
      </form>

      {previous.length > 0 ? (
        <section className="p-4 max-w-2xl mx-auto w-full">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Bisherige Runden
          </h2>
          <ul className="font-mono tabular-nums text-sm flex flex-col gap-1">
            {previous.map((r) => (
              <li key={r.id}>
                {r.roundNumber}: {initialOf(match.leftPlayer.name)} {r.leftPoints}{' '}
                / {initialOf(match.rightPlayer.name)} {r.rightPoints} (Geber{' '}
                {r.dealer === 0
                  ? initialOf(match.leftPlayer.name)
                  : initialOf(match.rightPlayer.name)}
                )
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
