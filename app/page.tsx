import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifySession } from './_lib/dal';
import { listMatches } from './_lib/queries';
import { formatDateTime } from './_lib/format';
import { Button } from './_components/Button';
import { LogoutButton } from './_components/LogoutButton';

export default async function HomePage() {
  const session = await verifySession();
  if (!session.valid) redirect('/login');

  const all = await listMatches();
  const inProgress = all.find((m) => m.status === 'in_progress');
  const finished = all.filter((m) => m.status === 'complete');

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-semibold">Rommé</h1>
        <LogoutButton />
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {inProgress ? (
          <Link
            href={`/matches/${inProgress.id}`}
            className="block rounded-xl border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] p-4 text-base"
          >
            <div className="flex items-center justify-between">
              <span>
                Spiel läuft — {inProgress.leftName} vs. {inProgress.rightName}{' '}
                ({inProgress.completedRounds}/{inProgress.roundCount})
              </span>
              <span aria-hidden>→</span>
            </div>
          </Link>
        ) : null}

        <Link href="/matches/new" className="block">
          <Button fullWidth>+ Neues Spiel</Button>
        </Link>

        <section className="flex flex-col gap-2 mt-4">
          <h2 className="text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Letzte Spiele
          </h2>
          {finished.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Noch keine abgeschlossenen Spiele.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {finished.map((m) => {
                const leftWins = m.leftTotal < m.rightTotal;
                const rightWins = m.rightTotal < m.leftTotal;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/matches/${m.id}`}
                      className="block rounded-xl border border-[var(--border)] p-4 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDateTime(m.playedAt)}
                      </div>
                      <div className="mt-1 font-mono tabular-nums text-lg">
                        <span className={leftWins ? 'font-semibold' : ''}>
                          {m.leftName} {m.leftTotal}
                        </span>
                        <span className="text-zinc-400"> – </span>
                        <span className={rightWins ? 'font-semibold' : ''}>
                          {m.rightName} {m.rightTotal}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
