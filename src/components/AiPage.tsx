import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MenuIcon } from "./AppLayout";
import type { AiPageProps } from "../types";

export default function AiPage({ aiLogs }: AiPageProps) {
  const models = [
    {
      value: "nllb-200-distilled-600M",
      label: "NLLB 200 Distilled 600M",
    },
  ];

  const [selectedModel, setSelectedModel] = useState(models[0].value);
  const [busy, setBusy] = useState<"" | "install" | "start">("");
  const [status, setStatus] = useState("مدل انتخاب‌شده آماده نصب است.");

  async function handleInstall(): Promise<void> {
    setBusy("install");
    setStatus("در حال ساخت محیط مجازی، نصب کتابخانه‌ها و دانلود مدل...");

    try {
      const result = await invoke<string>("install_ai_model", { model: selectedModel });
      setStatus(result);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setBusy("");
    }
  }

  async function handleStart(): Promise<void> {
    setBusy("start");
    setStatus("در حال آماده‌سازی محیط مجازی و راه‌اندازی FastAPI برای مدل انتخاب‌شده...");

    try {
      const result = await invoke<string>("start_ai_model", { model: selectedModel });
      setStatus(result);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="flex min-h-0 flex-1 m-[14px] items-stretch overflow-hidden rounded-[var(--radius-app-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[18px] shadow-[0_12px_34px_rgba(0,0,0,0.12)]">
      <div className="grid w-full grid-rows-[repeat(7,auto)_minmax(70px,1fr)] gap-[12px]">
        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MenuIcon type="ai" />
        </div>

        <h2 className="m-0 text-[1.35rem]">مدل هوش مصنوعی</h2>
        <p className="m-0 leading-[1.7] text-[var(--color-text-secondary)]">فعلاً فقط مدل NLLB 200 Distilled 600M در لیست فعال است.</p>

        <label htmlFor="ai-model" className="text-[var(--color-text-secondary)] font-[800]">
          انتخاب مدل
        </label>

        <select id="ai-model" className="min-h-[42px] w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[12px] py-0 text-[var(--color-text)] outline-none focus:border-[var(--color-border-strong)]" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {models.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>

        <div className="relative z-10 mt-[2px] flex flex-wrap gap-[10px] max-[760px]:w-full">
          <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-3)] px-[16px] py-[10px] text-white font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleInstall} disabled={Boolean(busy)}>
            {busy === "install" ? "در حال دانلود..." : "دانلود مدل"}
          </button>

          <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[16px] py-[10px] text-[var(--color-text)] font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleStart} disabled={Boolean(busy)}>
            راه‌اندازی FastAPI
          </button>
        </div>

        <div className="grid gap-[6px] overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel-2)] p-[14px]">
          <span className="text-[0.72rem] text-[var(--color-text-muted)]">{busy ? "در حال اجرا..." : "وضعیت"}</span>
          <strong className="block overflow-hidden text-ellipsis text-[0.82rem] font-[700] leading-[1.6] text-[var(--color-text-secondary)] [-webkit-line-clamp:4] [-webkit-box-orient:vertical] whitespace-normal">{status}</strong>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-[6px] overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-panel-2)] p-[10px]">
          <span className="text-[0.72rem] text-[var(--color-text-muted)]">لاگ دانلود و نصب</span>
          <div className="min-h-0 overflow-hidden">
            {aiLogs.length === 0 ? (
              <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] leading-[1.35] text-[var(--color-text-secondary)]">هنوز لاگی ثبت نشده.</p>
            ) : (
              aiLogs.slice(-6).map((line, index) => <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] leading-[1.35] text-[var(--color-text-secondary)]" key={`${line}-${index}`}>{line}</p>)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
