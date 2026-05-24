'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../_components/Button';
import { NumberInput } from '../../../_components/NumberInput';
import { editRound, deleteMatch } from './actions';
import { initialOf } from '../../../_lib/format';

type Round = {
  id: string;
  roundNumber: number;
  leftPoints: number;
  rightPoints: number;
  winner: 0 | 1;
  dealer: 0 | 1;
};
type Match = {
  id: string;
  status: 'in_progress' | 'complete';
  roundCount: number;
  leftPlayer: { id: string; name: string };
  rightPlayer: { id: string; name: string };
  rounds: Round[];
};

export function EditClient({ match }: { match: Match }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startEdit(id: string) {
    setEditing(id);
    setError(null);
  }

  async function save(round: Round, next: Partial<Round>) {
    const merged: Round = { ...round, ...next };
    const fd = new FormData();
    fd.set('roundId', round.id);
    fd.set('matchId', match.id);
    fd.set('leftPoints', String(merged.leftPoints));
    fd.set('rightPoints', String(merged.rightPoints));
    fd.set('winner', String(merged.winner));
    fd.set('dealer', String(merged.dealer));
    start(async () => {
      const res = await editRound({ error: null }, fd);
      if (res?.error) setError(res.error);
      else {
        setEditing(null);
        setError(null);
        router.refresh();
      }
    });
  }

  async function onDelete() {
    const fd = new FormData();
    fd.set('matchId', match.id);
    start(async () => {
      try {
        const res = await deleteMatch(fd);
        if (res?.error) {
          setError(res.error);
        }
      } catch {
        setError('Match konnte nicht gelöscht werden.');
      }
    });
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <Link
          href={`/matches/${match.id}`}
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          ← Zurück
        </Link>
        <h1 className="text-lg font-medium">Bearbeiten</h1>
        <span className="w-10" />
      </header>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <div className="text-base">
          {match.leftPlayer.name} vs. {match.rightPlayer.name}
        </div>

        {error ? (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <table className="w-full font-mono tabular-nums text-base border-collapse">
          <thead>
            <tr className="text-xs text-zinc-500 dark:text-zinc-400">
              <th className="text-left py-2 w-8">#</th>
              <th className="text-right py-2">{match.leftPlayer.name}</th>
              <th className="text-right py-2">{match.rightPlayer.name}</th>
              <th className="py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {match.rounds.map((r) =>
              editing === r.id ? (
                <EditRow
                  key={r.id}
                  match={match}
                  round={r}
                  pending={pending}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => save(r, next)}
                />
              ) : (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {r.roundNumber}
                  </td>
                  <td className="py-3 text-right">
                    {r.dealer === 0 ? (
                      <DealerMark name={match.leftPlayer.name} />
                    ) : null}
                    {r.leftPoints}
                  </td>
                  <td className="py-3 text-right">
                    {r.dealer === 1 ? (
                      <DealerMark name={match.rightPlayer.name} />
                    ) : null}
                    {r.rightPoints}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(r.id)}
                      aria-label={`Runde ${r.roundNumber} bearbeiten`}
                      className="text-[var(--accent)] text-sm"
                    >
                      ✎
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          {!confirmDelete ? (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setConfirmDelete(true)}
            >
              Match löschen
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
                werden.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={pending}
                >
                  Abbrechen
                </Button>
                <Button variant="danger" onClick={onDelete} disabled={pending}>
                  {pending ? 'Lösche…' : 'Ja, löschen'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function EditRow({
  match,
  round,
  pending,
  onCancel,
  onSave,
}: {
  match: Match;
  round: Round;
  pending: boolean;
  onCancel: () => void;
  onSave: (next: Partial<Round>) => void;
}) {
  const [leftPoints, setLeftPoints] = useState(String(round.leftPoints));
  const [rightPoints, setRightPoints] = useState(String(round.rightPoints));
  const [winner, setWinner] = useState<0 | 1>(round.winner);
  const [dealer, setDealer] = useState<0 | 1>(round.dealer);

  return (
    <tr className="border-t border-[var(--border)] align-top">
      <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
        {round.roundNumber}
      </td>
      <td className="py-3 pl-1" colSpan={2}>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            value={leftPoints}
            onValueChange={setLeftPoints}
            placeholder="0"
            className="text-2xl min-h-[48px]"
          />
          <NumberInput
            value={rightPoints}
            onValueChange={setRightPoints}
            placeholder="0"
            className="text-2xl min-h-[48px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
            Gewinner
            <select
              value={winner}
              onChange={(e) => setWinner(Number(e.target.value) as 0 | 1)}
              className="rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-2 min-h-[40px]"
            >
              <option value={0}>{match.leftPlayer.name}</option>
              <option value={1}>{match.rightPlayer.name}</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
            Geber
            <select
              value={dealer}
              onChange={(e) => setDealer(Number(e.target.value) as 0 | 1)}
              className="rounded-lg border border-[var(--border)] bg-white dark:bg-zinc-900 px-2 min-h-[40px]"
            >
              <option value={0}>{match.leftPlayer.name}</option>
              <option value={1}>{match.rightPlayer.name}</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Abbrechen
          </Button>
          <Button
            onClick={() =>
              onSave({
                leftPoints: Number(leftPoints || '0'),
                rightPoints: Number(rightPoints || '0'),
                winner,
                dealer,
              })
            }
            disabled={pending}
          >
            {pending ? 'Speichere…' : 'Speichern'}
          </Button>
        </div>
      </td>
      <td className="py-3 w-10" />
    </tr>
  );
}

function DealerMark({ name }: { name: string }) {
  return (
    <span
      aria-label={`Geber: ${name}`}
      className="inline-flex items-center justify-center mr-2 text-[0.7em] border border-current rounded-full w-5 h-5 align-middle"
    >
      {initialOf(name)}
    </span>
  );
}
