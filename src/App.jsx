import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

const menuItems = [
  {
    id: "home",
    title: "داشبورد",
    icon: "dashboard",
  },
  {
    id: "converter",
    title: "تبدیل SRT",
    icon: "document",
  },
  {
    id: "ai",
    title: "هوش مصنوعی",
    icon: "ai",
  },
  {
    id: "translate",
    title: "ترجمه",
    icon: "translate",
  },
  {
    id: "speech",
    title: "گفتار",
    icon: "speech",
  },
];

function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("dark");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let unlisten;

    listen("ai-log", (event) => {
      setAiLogs((current) => [...current.slice(-40), String(event.payload)]);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  async function handleSelectFolder() {
    setError("");
    setOutputPath("");
    setStats(null);

    const selected = await open({
      directory: true,
      multiple: false,
      title: "انتخاب پوشه فایل‌های SRT",
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    await processFolder(selected);
    setSelectedFolder(selected);
  }

  async function processFolder(folderPath) {
    setLoading(true);
    setError("");
    setOutputPath("");
    setStats(null);

    try {
      const result = await invoke("convert_srt_to_txt", { path: folderPath });
      setOutputPath(result);

      const baseDir = folderPath.replace(/\\/g, "/").split("/").pop() || folderPath;
      setStats({
        folderName: baseDir,
        outputPath: result,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setIsDragging(true);
  }, [loading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (loading) return;

    const items = e.dataTransfer.files;
    if (!items || items.length === 0) return;

    const firstItem = items[0];
    const filePath = firstItem.path || firstItem.webkitRelativePath;

    if (!filePath) {
      setError("نمی‌توان مسیر فایل را تشخیص داد.");
      return;
    }

    const parts = filePath.split(/[\\/]/);
    parts.pop();
    const folderPath = parts.join("/");

    if (folderPath) {
      await processFolder(folderPath);
      setSelectedFolder(folderPath);
    }
  }, [loading]);

  async function handleOpenOutput() {
    if (!outputPath) return;
    try {
      await invoke("open_output_folder", { path: outputPath });
    } catch (err) {
      setError(String(err));
    }
  }

  const getFileName = (fullPath) => {
    const cleaned = fullPath.replace(/\\/g, "/");
    const parts = cleaned.split("/");
    return parts[parts.length - 1] || cleaned;
  };

  function renderPage() {
    if (page === "converter") {
      return (
        <PageShell title="تبدیل SRT" tagline="انتخاب پوشه و تولید فایل‌های TXT خالص">
          <ConverterPanel
            selectedFolder={selectedFolder}
            outputPath={outputPath}
            error={error}
            loading={loading}
            stats={stats}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelectFolder={handleSelectFolder}
            onOpenOutput={handleOpenOutput}
            getFileName={getFileName}
          />
        </PageShell>
      );
    }

    if (page === "ai") {
      return (
        <PageShell title="هوش مصنوعی" tagline="دانلود، نصب و راه‌اندازی مدل ترجمه NLLB">
          <AiPage aiLogs={aiLogs} />
        </PageShell>
      );
    }

    if (page === "translate") {
      return (
        <PageShell title="ترجمه هوشمند" tagline="ترجمه متن با کمک هوش مصنوعی">
          <PlaceholderPage
            icon="translate"
            title="ترجمه هوشمند"
            description="این بخش برای ترجمه متن‌ها با هوش مصنوعی آماده می‌شود."
            items={[
              "ورود متن یا فایل متنی",
              "انتخاب زبان مبدأ و مقصد",
              "دریافت ترجمه روان و قابل ویرایش",
            ]}
          />
        </PageShell>
      );
    }

    if (page === "speech") {
      return (
        <PageShell title="متن به صوت" tagline="پخش متن با موتور گفتار سیستم">
          <TextToSpeechPage />
        </PageShell>
      );
    }

    return <HomePage onNavigate={setPage} />;
  }

  return (
    <AppLayout activePage={page} theme={theme} onThemeChange={setTheme} onNavigate={setPage}>
      {renderPage()}
    </AppLayout>
  );
}

function AppLayout({ activePage, theme, onThemeChange, onNavigate, children }) {
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

function HomePage({ onNavigate }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_132px] gap-[14px] overflow-hidden p-[14px] max-[760px]:grid-rows-[minmax(0,1fr)_150px]">
      <section className="min-h-0 grid grid-cols-[minmax(0,1fr)_390px] items-stretch gap-[18px] border border-[var(--color-border)] rounded-[var(--radius-app-lg)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-panel)_82%,transparent),color-mix(in_srgb,var(--color-panel-2)_74%,transparent))] p-[clamp(18px,3vw,34px)] shadow-[var(--shadow-app)] max-[900px]:grid-cols-1 max-[900px]:p-[18px]">
        <div className="flex min-w-0 flex-col justify-center">
          <span className="inline-flex h-fit w-fit items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-[10px] py-[6px] text-[0.68rem] font-[800] tracking-[0.08em] text-[var(--color-primary)]">SRT TO PLAIN TEXT</span>
          <h1 className="max-w-[760px] my-[14px_0_10px] text-[clamp(2rem,4.8vw,4rem)] leading-[1.04] tracking-[-0.055em] max-[900px]:my-[10px_0_8px] max-[900px]:text-[clamp(1.45rem,5vw,2.2rem)]">تبدیل فایل‌های SRT به متن خالص</h1>
          <p className="m-0 max-w-[720px] text-[clamp(0.9rem,1.2vw,1rem)] leading-[1.9] text-[var(--color-text-secondary)] max-[900px]:overflow-hidden max-[900px]:text-[0.82rem] max-[900px]:leading-[1.55] max-[900px]:[-webkit-line-clamp:2] max-[900px]:[-webkit-box-orient:vertical]">
            انتخاب پوشه، حذف زمان‌بندی و موقعیت زیرنویس، و ساخت خروجی TXT آماده برای ترجمه یا پردازش.
          </p>

          <button type="button" className="mt-[22px] inline-flex h-[46px] w-fit items-center justify-center gap-[8px] rounded-[7px] border border-transparent bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))] px-[20px] py-[12px] text-white font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:-translate-y-px disabled:opacity-[0.55] max-[900px]:mt-[12px] max-[900px]:w-[min(100%,260px)]" onClick={() => onNavigate("converter")}>
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

function PageShell({ title, tagline, children }) {
  return (
    <>
      <header className="flex h-[72px] flex-none items-center justify-between gap-[18px] overflow-hidden border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] px-[16px] py-[12px] max-[760px]:flex-[0_0_64px]">
        <div className="min-w-0">
          <span className="inline-flex h-fit w-fit items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-[10px] py-[6px] text-[0.68rem] font-[800] tracking-[0.08em] text-[var(--color-primary)]">TAB</span>
          <h1 className="m-0 mt-[4px] text-[1.25rem] tracking-[-0.03em]">{title}</h1>
        </div>
        <p className="m-0 max-w-[720px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] text-[var(--color-text-secondary)] max-[760px]:hidden">{tagline}</p>
      </header>

      {children}
    </>
  );
}

function ConverterPanel({
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
}) {
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
            <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
              <rect x="8" y="12" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M8 28l12-12h24l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 36v-8a8 8 0 0116 0v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
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

function AiPage({ aiLogs }) {
  const models = [
    {
      value: "nllb-200-distilled-600M",
      label: "NLLB 200 Distilled 600M",
    },
  ];

  const [selectedModel, setSelectedModel] = useState(models[0].value);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("مدل انتخاب‌شده آماده نصب است.");

  async function handleInstall() {
    setBusy("install");
    setStatus("در حال ساخت محیط مجازی، نصب کتابخانه‌ها و دانلود مدل...");

    try {
      const result = await invoke("install_ai_model", { model: selectedModel });
      setStatus(result);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setBusy("");
    }
  }

  async function handleStart() {
    setBusy("start");
    setStatus("در حال آماده‌سازی محیط مجازی و راه‌اندازی FastAPI برای مدل انتخاب‌شده...");

    try {
      const result = await invoke("start_ai_model", { model: selectedModel });
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

function PlaceholderPage({ icon, title, description, items }) {
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

function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState("");

  const loadVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis?.getVoices?.() || [];
    setVoices(availableVoices);

    if (!selectedVoice && availableVoices.length > 0) {
      const persianVoice = availableVoices.find((voice) =>
        /fa|persian/i.test(`${voice.lang} ${voice.name}`)
      );
      setSelectedVoice((persianVoice || availableVoices[0]).name);
    }
  }, [selectedVoice]);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);

    if (!("speechSynthesis" in window)) {
      setMessage("این مرورگر از تبدیل متن به صوت پشتیبانی نمی‌کند.");
    }

    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, [loadVoices]);

  function handleSpeak() {
    if (!("speechSynthesis" in window)) {
      setMessage("این مرورگر از تبدیل متن به صوت پشتیبانی نمی‌کند.");
      return;
    }

    if (!text.trim()) {
      setMessage("لطفاً متن را وارد کنید.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => item.name === selectedVoice);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "fa-IR";
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setMessage("در حال خواندن متن...");
    };

    utterance.onend = () => {
      setSpeaking(false);
      setMessage("خواندن متن تمام شد.");
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setMessage("در خواندن متن مشکلی پیش آمد.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function handleStop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMessage("خواندن متن متوقف شد.");
  }

  return (
    <section className="flex min-h-0 flex-1 m-[14px] overflow-hidden rounded-[var(--radius-app-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)] p-[18px] shadow-[0_12px_34px_rgba(0,0,0,0.12)]">
      <div className="grid h-full w-full grid-rows-[auto_minmax(0,1fr)_42px_42px_auto] gap-[10px]">
        <label htmlFor="speech-text" className="text-[var(--color-text-secondary)] font-[800]">
          متن برای تبدیل به صوت
        </label>
        <textarea
          id="speech-text"
          className="min-h-0 w-full resize-none rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[12px] py-[12px] leading-[1.7] text-[var(--color-text)] outline-none focus:border-[var(--color-border-strong)]"
          placeholder="متن خود را اینجا وارد کنید..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <select
          className="min-h-[42px] w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[12px] py-0 text-[var(--color-text)] outline-none focus:border-[var(--color-border-strong)]"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          {voices.length === 0 && <option value="">بدون صدای آماده</option>}
          {voices.map((voice) => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {voice.name}
            </option>
          ))}
        </select>

        <div className="relative z-10 flex flex-wrap gap-[10px] max-[760px]:w-full">
          <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-3)] px-[16px] py-[10px] text-white font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleSpeak} disabled={speaking}>
            <span>{speaking ? "در حال خواندن..." : "خواندن متن"}</span>
          </button>

          <button type="button" className="inline-flex min-h-[40px] items-center justify-center gap-[8px] rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[16px] py-[10px] text-[var(--color-text)] font-[800] transition-[transform,border-color,background-color] duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[&:not(:disabled)]:border-[var(--color-border-strong)] disabled:opacity-[0.55] max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleStop} disabled={!speaking}>
            <span>توقف</span>
          </button>
        </div>

        {message && <p className="m-0 rounded-[7px] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-[12px] py-[10px] text-[0.8rem] text-[var(--color-text-secondary)]">{message}</p>}
      </div>
    </section>
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

function MenuIcon({ type }) {
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

export default App;
