import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[var(--color-primary)] text-white border-transparent hover:bg-[var(--color-primary-dark)]",
  secondary: "bg-[var(--color-panel-3)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
  ghost: "bg-transparent text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-panel-3)]",
};

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] rounded-2xl border px-4 py-2 text-sm font-[800] transition duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-soft)] ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
