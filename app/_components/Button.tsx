import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const base =
  'inline-flex items-center justify-center rounded-xl font-medium text-base min-h-[48px] px-5 select-none touch-manipulation transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:opacity-90 active:opacity-80 focus-visible:outline-[var(--accent)]',
  secondary:
    'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost:
    'bg-transparent text-[var(--foreground)] hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60',
};

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`${base} ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    />
  );
}
