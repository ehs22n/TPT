export default function PageShell({ title, tagline, children }) {
  return (
    <>
      {/* <header className="flex h-[72px] flex-none items-center justify-between gap-[18px] overflow-hidden border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] px-[16px] py-[12px] max-[760px]:flex-[0_0_64px]">
        <div className="min-w-0">
          <span className="inline-flex h-fit w-fit items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-[10px] py-[6px] text-[0.68rem] font-[800] tracking-[0.08em] text-[var(--color-primary)]">TAB</span>
          <h1 className="m-0 mt-[4px] text-[1.25rem] tracking-[-0.03em]">{title}</h1>
        </div>
        <p className="m-0 max-w-[720px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] text-[var(--color-text-secondary)] max-[760px]:hidden">{tagline}</p>
      </header> */}

      {children}
    </>
  );
}
