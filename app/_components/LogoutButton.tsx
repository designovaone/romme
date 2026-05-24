'use client';

import { useTransition } from 'react';
import { logout } from '../login/actions';
import { Button } from './Button';

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => start(() => logout())}
      disabled={pending}
      className="text-sm"
    >
      Abmelden
    </Button>
  );
}
