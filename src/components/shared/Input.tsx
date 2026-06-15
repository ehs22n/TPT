import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-2)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] focus:border-[var(--color-border-strong)] focus:ring-4 focus:ring-[var(--color-primary-soft)] placeholder:text-[var(--color-text-muted)] ${className}`.trim()}
      {...props}
    />
  );
}
