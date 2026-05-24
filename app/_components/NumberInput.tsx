'use client';

import * as React from 'react';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value'
> & {
  value: string;
  onValueChange: (next: string) => void;
};

export const NumberInput = React.forwardRef<HTMLInputElement, Props>(
  function NumberInput({ value, onValueChange, className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          const stripped = e.target.value.replace(/[^0-9]/g, '');
          onValueChange(stripped);
        }}
        className={
          'w-full text-4xl font-mono tabular-nums text-center min-h-[64px] rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:border-[var(--accent)] ' +
          className
        }
        {...rest}
      />
    );
  }
);
