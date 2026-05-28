'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../_components/Button';
import { updateMatchExtras } from './actions';

type StartJoker = 'none' | 'left' | 'right';

const inputClass =
  'rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 min-h-[44px] outline-none focus:border-[var(--accent)]';

// Match-level joker tracking: just the start joker (who lifted a joker off the
// stack when the match began). Per-player joker counts are recorded per round
// during round entry and accumulate across the match — they're not set here.
// Editable both while a game is in progress and after it finishes. On the
// in-progress screen the panel's local state resets if the match auto-completes
// on the final round — so set it early, or correct it afterwards via
// "Bearbeiten".
export function MatchExtras({
  matchId,
  leftName,
  rightName,
  startJoker,
  hint,
}: {
  matchId: string;
  leftName: string;
  rightName: string;
  startJoker: 0 | 1 | null;
  hint?: string;
}) {
  const router = useRouter();
  const [sj, setSj] = useState<StartJoker>(
    startJoker === 0 ? 'left' : startJoker === 1 ? 'right' : 'none'
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSave() {
    const fd = new FormData();
    fd.set('matchId', matchId);
    fd.set('startJoker', sj);
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
        Start-Joker
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
            {pending ? 'Speichere…' : 'Start-Joker speichern'}
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
