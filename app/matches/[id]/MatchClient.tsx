'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitRound, discardMatch } from './actions';
import { Button } from '../../_components/Button';
import { NumberInput } from '../../_components/NumberInput';
import { MatchExtras } from './MatchExtras';
import { initialOf } from '../../_lib/format';

type Match = {
  id: string;
  status: 'in_progress' | 'complete';
  roundCount: number;
  startJoker: 0 | 1 | null;
  leftPlayer: { id: string; name: string };
  rightPlayer: { id: string; name: string };
  rounds: Array<{
    id: string;
    roundNumber: number;
    leftPoints: number;
    rightPoints: number;
    winner: 0 | 1;
    dealer: 0 | 1;
    leftJokers: number | null;
    rightJokers: number | null;
  }>;
};

export function MatchClient({ match }: { match: Match }) {
  const router = useRouter();
  const nextRoundNumber = match.rounds.length + 1;
  const dealer: 0 | 1 = ((nextRoundNumber - 1) % 2) as 0 | 1;
  const dealerName = dealer === 0 ? match.leftPlayer.name : match.rightPlayer.name;

  const [leftPoints, setLeftPoints] = useState('');
  const [rightPoints, setRightPoints] = useState('');
  const [leftJokers, setLeftJokers] = useState('');
  const [rightJokers, setRightJokers] = useState('');
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pending, start] = useTransition();

  function onDiscard() {
    const fd = new FormData();
    fd.set('matchId', match.id);
    start(async () => {
      const res = await discardMatch(fd);
      if (res?.error) setError(res.error);
    });
  }

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
      setLeftJokers('');
      setRightJokers('');
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

  // Jokers accumulate game by game; the match total is the running sum.
  const leftJokerTotal = match.rounds.reduce((s, r) => s + (r.leftJokers ?? 0), 0);
  const rightJokerTotal = match.rounds.reduce((s, r) => s + (r.rightJokers ?? 0), 0);
  const anyJokers = match.rounds.some(
    (r) => r.leftJokers != null || r.rightJokers != null
  );

  return (
    <main className={`min-h-dvh flex flex-col ${flash ? 'flash' : ''}`}>
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)]">
        {/* Stacked + centered so the round counter reads big and nothing
            overflows horizontally on a narrow phone. The back link is taken
            out of flow (absolute) so it can't push the centered title. */}
        <header className="relative px-3 pt-3 pb-2 flex flex-col items-center gap-1 text-center">
          <Link
            href="/"
            className="absolute left-3 top-3 text-sm text-zinc-600 dark:text-zinc-400"
          >
            ← Zurück
          </Link>
          <div className="max-w-full truncate px-16 text-sm font-medium">
            {match.leftPlayer.name} ↔ {match.rightPlayer.name}
          </div>
          <div className="text-3xl font-bold tabular-nums">
            Runde {nextRoundNumber}/{match.roundCount}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Geber: <span className="font-medium">{dealerName}</span>
          </div>
          <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
            Vor Spielbeginn: 1 Karte ziehen — bei Joker behalten.
          </p>
        </header>
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

        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            Joker diese Runde (optional)
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="leftJokers"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="—"
              aria-label={`${match.leftPlayer.name} — Joker diese Runde`}
              value={leftJokers}
              onChange={(e) =>
                setLeftJokers(e.target.value.replace(/[^0-9]/g, ''))
              }
              className="rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[44px] outline-none focus:border-[var(--accent)] font-mono tabular-nums"
            />
            <input
              name="rightJokers"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="—"
              aria-label={`${match.rightPlayer.name} — Joker diese Runde`}
              value={rightJokers}
              onChange={(e) =>
                setRightJokers(e.target.value.replace(/[^0-9]/g, ''))
              }
              className="rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[44px] outline-none focus:border-[var(--accent)] font-mono tabular-nums"
            />
          </div>
        </fieldset>

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
                {r.leftJokers != null || r.rightJokers != null ? (
                  <>
                    {', '}Joker {initialOf(match.leftPlayer.name)}{' '}
                    {r.leftJokers ?? 0} / {initialOf(match.rightPlayer.name)}{' '}
                    {r.rightJokers ?? 0}
                  </>
                ) : null}
                )
              </li>
            ))}
          </ul>
          {anyJokers ? (
            <p className="mt-2 font-mono tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
              Joker gesamt: {initialOf(match.leftPlayer.name)} {leftJokerTotal} /{' '}
              {initialOf(match.rightPlayer.name)} {rightJokerTotal}
            </p>
          ) : null}
        </section>
      ) : null}

      <MatchExtras
        matchId={match.id}
        leftName={match.leftPlayer.name}
        rightName={match.rightPlayer.name}
        startJoker={match.startJoker}
        hint="Wer beim Stapelheben den Joker zog. Joker pro Runde werden oben bei der Rundeneingabe erfasst."
      />

      <div className="p-4 max-w-2xl mx-auto w-full mt-auto">
        {!confirmDiscard ? (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setConfirmDiscard(true)}
            disabled={pending}
          >
            Spiel verwerfen
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Dieses Spiel verwerfen? Alle erfassten Runden gehen verloren.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmDiscard(false)}
                disabled={pending}
              >
                Abbrechen
              </Button>
              <Button variant="danger" onClick={onDiscard} disabled={pending}>
                {pending ? 'Verwerfe…' : 'Ja, verwerfen'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
