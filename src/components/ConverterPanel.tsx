import { BiCloudUpload } from "react-icons/bi";
import type { ConverterPanelProps } from "../types";

export default function ConverterPanel({
  selectedFolder,
  outputPath,
  error,
  loading,
  stats,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFolder,
  onOpenOutput,
  getFileName,
}: ConverterPanelProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_330px] gap-[14px] overflow-hidden p-[14px] max-[900px]:grid-cols-[minmax(0,1fr)_280px] max-[760px]:grid-cols-1">
      <section
        className={`relative min-h-0 flex flex-col justify-center gap-[16px] overflow-hidden rounded-[var(--radius-app-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[clamp(18px,4vw,42px)] shadow-[0_12px_34px_rgba(0,0,0,0.12)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_20%,var(--color-primary-soft),transparent_55%)] before:opacity-0 hover:border-[var(--color-border-strong)] before:hover:opacity-100 max-[900px]:p-[18px] ${isDragging ? "border-[var(--color-border-strong)] before:opacity-100" : ""} ${loading ? "opacity-[0.72]" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[7px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <BiCloudUpload size={30} aria-hidden="true" />
          </div>
          <span className="inline-flex h-fit w-fit items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-[10px] py-[6px] text-[0.68rem] font-[800] tracking-[0.08em] text-[var(--color-primary)]">{loading ? "Processing" : "Ready"}</span>
        </div>

        <div className="relative z-10">
          <h2 className="m-0 mb-[8px] text-[clamp(1.35rem,2.6vw,2.2rem)] leading-[1.2] tracking-[-0.04em] max-[900px]:text-[1.35rem]">پوشه فایل‌های SRT را انتخاب کنید</h2>
          <p className="m-0 leading-[1.7] text-[var(--color-text-secondary)] max-[900px]:text-[0.78rem] max-[900px]:leading-[1.45]">برای شروع، پوشه را انتخاب یا داخل همین پنل رها کنید.</p>
        </div>

        <div className="relative z-10 max-w-[760px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] p-[12px_14px]">
          <span className="mb-[5px] block text-[0.7rem] text-[var(--color-text-muted)]">مسیر انتخاب‌شده</span>
          <strong className="block [direction:ltr] [unicode-bidi:embed] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem]">{selectedFolder || "هنوز پوشه‌ای انتخاب نشده"}</strong>
        </div>

        <div className="relative z-10 flex flex-wrap gap-[10px] max-[760px]:w-full">
          <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-3)] px-[16px] py-[10px] text-[var(--color-text)] font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={onSelectFolder} disabled={loading}>
            {loading ? (
              <>
                <span className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/28 border-t-white" />
                <span>در حال تبدیل...</span>
              </>
            ) : (
              <span>انتخاب پوشه</span>
            )}
          </button>

          {outputPath && (
            <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[16px] py-[10px] text-[var(--color-text)] font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={onOpenOutput}>
              <span>باز کردن خروجی</span>
            </button>
          )}
        </div>

        {isDragging && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[rgba(99,102,241,0.92)] font-[900] text-white">پوشه را اینجا رها کنید</div>}
      </section>

      <aside className="flex min-h-0 flex-col rounded-[var(--radius-app-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[16px] shadow-[0_12px_34px_rgba(0,0,0,0.12)] max-[760px]:hidden">
        <div className="relative z-10 flex items-center justify-between border-b border-[var(--color-border)] pb-[12px] text-[0.76rem] text-[var(--color-text-muted)]">
          <span>نتیجه</span>
          <strong className="text-[var(--color-success)]">{stats ? "موفق" : "در انتظار اجرا"}</strong>
        </div>

        {stats && !error && (
          <div className="mt-[14px] rounded-[7px] border border-[rgba(74,222,128,0.22)] bg-[var(--color-success-soft)] p-[14px] text-[var(--color-success)]">
            <h3 className="m-0 mb-[8px] text-[0.95rem]">تبدیل انجام شد</h3>
            <p className="m-0 text-[0.78rem] leading-[1.7] text-[var(--color-text-secondary)]">
              فایل‌های <strong className="mt-[6px] block [direction:ltr] [unicode-bidi:embed] overflow-hidden text-ellipsis whitespace-nowrap">{getFileName(stats.folderName)}</strong> در
              <strong className="mt-[6px] block [direction:ltr] [unicode-bidi:embed] overflow-hidden text-ellipsis whitespace-nowrap">{getFileName(stats.outputPath)}</strong> ذخیره شدند.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-[14px] rounded-[7px] border border-[rgba(251,113,133,0.22)] bg-[var(--color-error-soft)] p-[14px] text-[var(--color-error)]">
            <h3 className="m-0 mb-[8px] text-[0.95rem]">خطا</h3>
            <p className="m-0 text-[0.78rem] leading-[1.7] text-[var(--color-text-secondary)]">{error}</p>
          </div>
        )}

        {!stats && !error && (
          <div className="mt-[14px] flex flex-1 place-items-center rounded-[7px] border border-dashed border-[var(--color-border-strong)] bg-transparent p-[14px] text-center text-[var(--color-text-muted)]">
            <span className="text-[3.2rem] font-[900] tracking-[-0.08em] text-[var(--color-primary)]">0</span>
            <p className="m-0 text-[0.78rem] leading-[1.6] text-[var(--color-text-muted)]">نتیجه تبدیل بعد از انتخاب پوشه نمایش داده می‌شود.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
