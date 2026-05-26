'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../_components/Button';
import { updateMatchExtras } from './actions';

type StartJoker = 'none' | 'left' | 'right';

const inputClass =
  'rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[44px] outline-none focus:border-[var(--accent)]';

// Match-level joker tracking, editable both while a game is in progress (set
// the start joker early) and after it finishes (fill in the per-player totals).
// On the in-progress screen the panel's local state resets if the match
// auto-completes on the final round — so save before recording the last round,
// or correct it afterwards via "Bearbeiten".
export function MatchExtras({
  matchId,
  leftName,
  rightName,
  startJoker,
  leftJokers,
  rightJokers,
  hint,
}: {
  matchId: string;
  leftName: string;
  rightName: string;
  startJoker: 0 | 1 | null;
  leftJokers: number | null;
  rightJokers: number | null;
  hint?: string;
}) {
  const router = useRouter();
  const [sj, setSj] = useState<StartJoker>(
    startJoker === 0 ? 'left' : startJoker === 1 ? 'right' : 'none'
  );
  const [lj, setLj] = useState(leftJokers == null ? '' : String(leftJokers));
  const [rj, setRj] = useState(rightJokers == null ? '' : String(rightJokers));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSave() {
    const fd = new FormData();
    fd.set('matchId', matchId);
    fd.set('startJoker', sj);
    fd.set('leftJokers', lj);
    fd.set('rightJokers', rj);
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateMatchExtras(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  return (
    <section className="p-4 max-w-2xl mx-auto w-full">
      <h2 className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
        Joker
      </h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Joker zu Spielbeginn (Stapel gehoben)
          </span>
          <select
            value={sj}
            onChange={(e) => setSj(e.target.value as StartJoker)}
            className={inputClass}
          >
            <option value="none">Niemand</option>
            <option value="left">{leftName}</option>
            <option value="right">{rightName}</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {leftName} — Joker erhalten
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="—"
              value={lj}
              onChange={(e) => setLj(e.target.value.replace(/[^0-9]/g, ''))}
              className={`${inputClass} font-mono tabular-nums`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {rightName} — Joker erhalten
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="—"
              value={rj}
              onChange={(e) => setRj(e.target.value.replace(/[^0-9]/g, ''))}
              className={`${inputClass} font-mono tabular-nums`}
            />
          </label>
        </div>

        {hint ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}

        {error ? (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onSave} disabled={pending}>
            {pending ? 'Speichere…' : 'Joker speichern'}
          </Button>
          <span
            aria-live="polite"
            className="text-sm text-[var(--accent)] font-medium"
          >
            {saved ? 'Gespeichert ✓' : ''}
          </span>
        </div>
      </div>
    </section>
  );
}
