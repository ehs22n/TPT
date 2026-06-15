import { MenuIcon } from "./AppLayout";

export default function HomePage({ onNavigate }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_132px] gap-[14px] overflow-hidden p-[14px] max-[760px]:grid-rows-[minmax(0,1fr)_150px]">
      <section className="min-h-0 grid grid-cols-[minmax(0,1fr)_390px] items-stretch gap-[18px] border border-[var(--color-border)] rounded-[var(--radius-app-lg)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-panel)_82%,transparent),color-mix(in_srgb,var(--color-panel-2)_74%,transparent))] p-[clamp(18px,3vw,34px)] shadow-[var(--shadow-app)] max-[900px]:grid-cols-1 max-[900px]:p-[18px]">
        <div className="flex min-w-0 flex-col justify-center">
          <span className="inline-flex h-fit w-fit items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-[10px] py-[6px] text-[0.68rem] font-[800] tracking-[0.08em] text-[var(--color-primary)]">SRT TO PLAIN TEXT</span>
          <h1 className="max-w-[760px] my-[14px_0_10px] text-[clamp(2rem,4.8vw,4rem)] leading-[1.04] tracking-[-0.055em] max-[900px]:my-[10px_0_8px] max-[900px]:text-[clamp(1.45rem,5vw,2.2rem)]">تبدیل فایل‌های SRT به متن خالص</h1>
          <p className="m-0 max-w-[720px] text-[clamp(0.9rem,1.2vw,1rem)] leading-[1.9] text-[var(--color-text-secondary)] max-[900px]:overflow-hidden max-[900px]:text-[0.82rem] max-[900px]:leading-[1.55] max-[900px]:[-webkit-line-clamp:2] max-[900px]:[-webkit-box-orient:vertical]">
            انتخاب پوشه، حذف زمان‌بندی و موقعیت زیرنویس، و ساخت خروجی TXT آماده برای ترجمه یا پردازش.
          </p>

          <button type="button" className="mt-[22px] inline-flex h-[46px] w-fit items-center justify-center gap-[8px] rounded-[7px] border border-transparent bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))] px-[20px] py-[12px] text-white font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:-translate-y-px disabled:opacity-[0.55] max-[900px]:mt-[12px] max-[900px]:w-[min(100%,260px)]" onClick={() => onNavigate("converter") }>
            <span>ورود به ابزار تبدیل</span>
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-[16px] max-[900px]:hidden">
          <div className="flex min-h-[210px] w-[178px] flex-col justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel-2)] p-[20px]">
            <span className="text-[0.68rem] tracking-[0.08em] text-[var(--color-text-muted)]">SUBTITLE.SRT</span>
            <strong className="mt-[12px] text-[1.1rem]">زمان + موقعیت</strong>
            <p className="mt-[8px] text-[0.8rem] leading-[1.5] text-[var(--color-text-secondary)]">فرمت SRT</p>
          </div>
          <div className="h-[2px] w-[58px] bg-[linear-gradient(90deg,var(--color-border-strong),var(--color-primary))] after:pointer-events-none after:absolute after:right-0 after:top-1/2 after:h-[10px] after:w-[10px] after:-translate-y-1/2 after:rotate-45 after:border-t-2 after:border-r-2 after:border-t-[var(--color-primary)] after:border-r-[var(--color-primary)] after:content-['']" />
          <div className="flex min-h-[210px] w-[178px] flex-col justify-center rounded-[8px] border border-[rgba(74,222,128,0.28)] bg-[var(--color-panel-2)] p-[20px]">
            <span className="text-[0.68rem] tracking-[0.08em] text-[var(--color-text-muted)]">TEXT.TXT</span>
            <strong className="mt-[12px] text-[1.1rem] text-[var(--color-success)]">فقط متن</strong>
            <p className="mt-[8px] text-[0.8rem] leading-[1.5] text-[var(--color-text-secondary)]">خروجی خالص</p>
          </div>
        </div>
      </section>

      <section className="min-h-0 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[14px] max-[900px]:gap-[8px] max-[760px]:grid-cols-1" aria-label="امکانات برنامه">
        <div className="grid grid-cols-[42px_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-y-[4px] gap-x-[10px] rounded-[var(--radius-app)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[16px] shadow-[0_12px_34px_rgba(0,0,0,0.12)] max-[900px]:grid-cols-[32px_minmax(0,1fr)] max-[900px]:gap-y-[6px] max-[900px]:gap-x-[6px] max-[900px]:p-[10px]">
          <span className="contents [&_svg]:row-[1_/_3] [&_svg]:text-[var(--color-primary)]">
            <MenuIcon type="document" />
          </span>
          <h2 className="m-0 text-[1rem] max-[900px]:text-[0.86rem]">دسته‌ای</h2>
          <p className="m-0 text-[0.78rem] leading-[1.55] text-[var(--color-text-secondary)] max-[900px]:text-[0.7rem] max-[900px]:leading-[1.35]">تبدیل همه SRTهای داخل پوشه</p>
        </div>

        <div className="grid grid-cols-[42px_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-y-[4px] gap-x-[10px] rounded-[var(--radius-app)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[16px] shadow-[0_12px_34px_rgba(0,0,0,0.12)] max-[900px]:grid-cols-[32px_minmax(0,1fr)] max-[900px]:gap-y-[6px] max-[900px]:gap-x-[6px] max-[900px]:p-[10px]">
          <span className="contents [&_svg]:row-[1_/_3] [&_svg]:text-[var(--color-primary)]">
            <MenuIcon type="translate" />
          </span>
          <h2 className="m-0 text-[1rem] max-[900px]:text-[0.86rem]">متن خالص</h2>
          <p className="m-0 text-[0.78rem] leading-[1.55] text-[var(--color-text-secondary)] max-[900px]:text-[0.7rem] max-[900px]:leading-[1.35]">بدون زمان، شماره و تگ</p>
        </div>

        <div className="grid grid-cols-[42px_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-y-[4px] gap-x-[10px] rounded-[var(--radius-app)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[16px] shadow-[0_12px_34px_rgba(0,0,0,0.12)] max-[900px]:grid-cols-[32px_minmax(0,1fr)] max-[900px]:gap-y-[6px] max-[900px]:gap-x-[6px] max-[900px]:p-[10px]">
          <span className="contents [&_svg]:row-[1_/_3] [&_svg]:text-[var(--color-primary)]">
            <MenuIcon type="speech" />
          </span>
          <h2 className="m-0 text-[1rem] max-[900px]:text-[0.86rem]">گفتار</h2>
          <p className="m-0 text-[0.78rem] leading-[1.55] text-[var(--color-text-secondary)] max-[900px]:text-[0.7rem] max-[900px]:leading-[1.35]">مرور خروجی با صدای سیستم</p>
        </div>
      </section>
    </div>
  );
}

export function PlaceholderPage({ icon, title, description, items }) {
  return (
    <section className="flex min-h-0 flex-1 m-[14px] items-center justify-center overflow-hidden rounded-[var(--radius-app-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[18px] text-center shadow-[0_12px_34px_rgba(0,0,0,0.12)]">
      <div>
        <div className="mb-[12px] flex h-[58px] w-[58px] items-center justify-center rounded-[8px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MenuIcon type={icon} />
        </div>
        <h2 className="m-0 mb-[8px] text-[1.35rem]">{title}</h2>
        <p className="mx-auto mb-[14px] max-w-[620px] leading-[1.7] text-[var(--color-text-secondary)]">{description}</p>

        <div className="grid w-[min(100%,560px)] gap-[8px]">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-[10px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[12px] py-[10px] text-[0.8rem] text-[var(--color-text-secondary)]">
              <span className="h-[8px] w-[8px] flex-none rounded-full bg-[var(--color-primary)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
