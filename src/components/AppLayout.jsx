import React from "react";

export function AppLayout({ activePage, theme, onThemeChange, onNavigate, children, menuItems }) {
  return (
    <div className="relative h-dvh w-full grid grid-cols-[238px_minmax(0,1fr)] overflow-hidden bg-[radial-gradient(circle_at_18%_0%,rgba(129,140,248,0.2),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.12),transparent_28%),var(--color-bg)] max-[900px]:grid-cols-[86px_minmax(0,1fr)] max-[760px]:grid-cols-[72px_minmax(0,1fr)]">
      <div className="pointer-events-none fixed z-0 h-[420px] w-[420px] rounded-full blur-[90px] opacity-[0.28] -top-[180px] left-[280px] bg-[rgba(99,102,241,0.55)]" />
      <div className="pointer-events-none fixed z-0 h-[420px] w-[420px] rounded-full blur-[90px] opacity-[0.28] -right-[140px] -bottom-[160px] bg-[rgba(14,165,233,0.34)]" />

      <aside className="relative z-10 min-w-0 h-dvh flex flex-col gap-[14px] overflow-hidden border-r border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_92%,transparent)] p-[14px] shadow-[12px_0_40px_rgba(0,0,0,0.16)] max-[900px]:p-[10px]">
        <div className="flex min-h-[56px] items-center gap-[10px] px-[8px] max-[900px]:hidden">
          <AppLogo />
          <div>
            <strong className="block text-[0.82rem] leading-[1.25]">دستیار هوشمند متن</strong>
            <span className="mt-[2px] block text-[0.7rem] text-[var(--color-text-muted)]">نسخه دسکتاپ</span>
          </div>
        </div>

        <nav className="grid flex-1 grid-rows-[repeat(5,54px)] gap-[8px] max-[900px]:grid-rows-[repeat(5,52px)]" aria-label="تب‌های برنامه">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`grid h-[54px] grid-cols-[36px_minmax(0,1fr)] items-center gap-[10px] border border-transparent bg-transparent px-[12px] text-right text-[var(--color-text-secondary)] transition-[background-color,border-color,color] duration-[140ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:bg-[var(--color-panel-3)] hover:text-[var(--color-text)] max-[900px]:grid-cols-[1fr] max-[900px]:justify-items-center max-[900px]:p-0 ${activePage === item.id ? "border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-text)]" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={item.title}
            >
              <span className="flex h-[36px] w-[36px] items-center justify-center rounded-[6px] text-current">
                <MenuIcon type={item.icon} />
              </span>
              <span className="truncate whitespace-nowrap text-[0.84rem] font-[800]">{item.title}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="min-h-[42px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-3)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] max-[900px]:hidden"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </aside>

      <main className="relative z-10 min-w-0 h-dvh flex flex-col overflow-hidden">
        <header className="flex h-[34px] flex-none items-center gap-[8px] border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] px-[14px] text-[0.72rem] tracking-[0.08em] text-[var(--color-text-muted)]">
          <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[#ffbd2e]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          <strong>Made BY Ehsan</strong>
        </header>

        {children}
      </main>
    </div>
  );
}

function AppLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
      <path d="M14 18h20M14 26h14M14 34h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MenuIcon({ type }) {
  if (type === "dashboard") {
    return (
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <path d="M4 13h8V4H4v9zm12 11h8V4h-8v20zM4 24h8v-7H4v7zm12-15h8v-5h-8v5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "ai") {
    return (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M14 3.5l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8L14 3.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 20.5h12M10 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "translate") {
    return (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M4 5h10M9 5c-.5 5-2.5 9-6 12M4 5c1.5 5 4 9 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 8h8M16 12h6M18 8l-4 10M20 13l4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "speech") {
    return (
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M5 10v6h4l5 4V6l-5 4H5zM17 12a4 4 0 010 4M19.5 9.5a7 7 0 010 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <path d="M8 5h10l4 4v14H8V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 5v5h5M10 13h8M10 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
