'use client';

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { createMatch, type CreateMatchState } from './actions';
import { Button } from '../../_components/Button';

const initial: CreateMatchState = { error: null };

const ROUND_OPTIONS = [3, 5, 10] as const;
type RoundCount = (typeof ROUND_OPTIONS)[number];

export function NewMatchForm({
  defaultLeft,
  defaultRight,
}: {
  defaultLeft: string;
  defaultRight: string;
}) {
  const [left, setLeft] = useState(defaultLeft);
  const [right, setRight] = useState(defaultRight);
  const [roundCount, setRoundCount] = useState<RoundCount>(5);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createMatch, initial);

  function swap() {
    setLeft(right);
    setRight(left);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set('playedAt', new Date().toISOString());
    formAction(fd);
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400">
          ← Zurück
        </Link>
        <h1 className="text-lg font-medium">Neues Spiel</h1>
        <span className="w-10" />
      </header>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex-1 p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Links
            </span>
            <input
              name="leftPlayer"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              autoComplete="off"
              className="rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[48px] text-lg outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            onClick={swap}
            aria-label="Spieler tauschen"
            className="min-h-[48px] min-w-[48px] rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 text-xl"
          >
            ↔
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Rechts
            </span>
            <input
              name="rightPlayer"
              value={right}
              onChange={(e) => setRight(e.target.value)}
              autoComplete="off"
              className="rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[48px] text-lg outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            Anzahl Runden
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ROUND_OPTIONS.map((n) => (
              <label
                key={n}
                className={`min-h-[48px] flex items-center justify-center rounded-xl border cursor-pointer text-lg font-mono tabular-nums ${
                  roundCount === n
                    ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]'
                    : 'border-[var(--border)] bg-white dark:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="roundCount"
                  value={n}
                  checked={roundCount === n}
                  onChange={() => setRoundCount(n)}
                  className="sr-only"
                />
                {n}
              </label>
            ))}
          </div>
        </fieldset>

        {state?.error ? (
          <p className="text-red-600 text-sm" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} fullWidth>
          {pending ? 'Starte…' : 'Spiel starten'}
        </Button>
      </form>
    </main>
  );
}
