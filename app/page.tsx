import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifySession } from './_lib/dal';
import { listMatches, getPlayers } from './_lib/queries';
import { formatDateTime } from './_lib/format';
import { Button } from './_components/Button';
import { LogoutButton } from './_components/LogoutButton';

export default async function HomePage() {
  const session = await verifySession();
  if (!session.valid) redirect('/login');

  const all = await listMatches();
  const inProgress = all.find((m) => m.status === 'in_progress');
  const finished = all.filter((m) => m.status === 'complete');

  // Standings over completed games only. Lower points is better; a win is a
  // completed game with the lower total (ties count for neither player).
  const players = await getPlayers();
  const stats = new Map<string, { wins: number; points: number }>(
    players.map((p) => [p.name, { wins: 0, points: 0 }])
  );
  for (const m of finished) {
    const l = stats.get(m.leftName);
    const r = stats.get(m.rightName);
    if (l) l.points += m.leftTotal;
    if (r) r.points += m.rightTotal;
    if (m.leftTotal < m.rightTotal && l) l.wins += 1;
    else if (m.rightTotal < m.leftTotal && r) r.wins += 1;
  }
  const standings = players.map((p) => ({
    name: p.name,
    wins: stats.get(p.name)?.wins ?? 0,
    points: stats.get(p.name)?.points ?? 0,
  }));

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-semibold">Rommé</h1>
        <LogoutButton />
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <section>
          <table className="w-full tabular-nums text-base border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="text-left py-2 font-medium">Name</th>
                <th className="text-right py-2 font-medium">Siege</th>
                <th className="text-right py-2 font-medium">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.name} className="border-t border-[var(--border)]">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2 text-right font-mono">{s.wins}</td>
                  <td className="py-2 text-right font-mono">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <hr className="border-[var(--border)]" />

        <Link href="/matches/new" className="block">
          <Button fullWidth>+ Neues Spiel</Button>
        </Link>

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
