'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
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
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const leftRef = useRef<HTMLInputElement>(null);
  const rightRef = useRef<HTMLInputElement>(null);

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
      setWinner(null);
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

  function pickWinner(w: 0 | 1) {
    setWinner(w);
    if (w === 0) {
      setLeftPoints('0');
      setTimeout(() => rightRef.current?.focus(), 0);
    } else {
      setRightPoints('0');
      setTimeout(() => leftRef.current?.focus(), 0);
    }
  }

  const canSubmit = useMemo(() => {
    if (winner === null) return false;
    if (winner === 0 && leftPoints !== '0') return false;
    if (winner === 1 && rightPoints !== '0') return false;
    if (winner === 0 && rightPoints === '') return false;
    if (winner === 1 && leftPoints === '') return false;
    return true;
  }, [winner, leftPoints, rightPoints]);

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
        <input type="hidden" name="leftPoints" value={leftPoints} />
        <input type="hidden" name="rightPoints" value={rightPoints} />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {match.leftPlayer.name}
            </span>
            <NumberInput
              ref={leftRef}
              value={leftPoints}
              onValueChange={setLeftPoints}
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {match.rightPlayer.name}
            </span>
            <NumberInput
              ref={rightRef}
              value={rightPoints}
              onValueChange={setRightPoints}
              placeholder="0"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            Gewonnen
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pickWinner(0)}
              className={`min-h-[56px] rounded-xl border text-lg ${
                winner === 0
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] font-semibold'
                  : 'border-[var(--border)] bg-white dark:bg-zinc-900'
              }`}
            >
              {match.leftPlayer.name}
            </button>
            <button
              type="button"
              onClick={() => pickWinner(1)}
              className={`min-h-[56px] rounded-xl border text-lg ${
                winner === 1
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] font-semibold'
                  : 'border-[var(--border)] bg-white dark:bg-zinc-900'
              }`}
            >
              {match.rightPlayer.name}
            </button>
          </div>
        </fieldset>

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
