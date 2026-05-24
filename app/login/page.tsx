'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';
import { Button } from '../_components/Button';

const initial: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-3xl font-semibold mb-2">Rommé</h1>
        <label htmlFor="password" className="text-sm text-zinc-600 dark:text-zinc-400">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          className="rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 px-4 min-h-[48px] text-lg outline-none focus:border-[var(--accent)]"
        />
        {state?.error ? (
          <p className="text-red-600 text-sm" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} fullWidth>
          {pending ? 'Prüfe…' : 'Anmelden'}
        </Button>
      </form>
    </main>
  );
}
