import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

const menuItems = [
  { id: "home", title: "داشبورد", icon: "dashboard" },
  { id: "converter", title: "تبدیل SRT", icon: "document" },
  { id: "ai", title: "هوش مصنوعی", icon: "ai" },
  { id: "translate", title: "ترجمه", icon: "translate" },
  { id: "speech", title: "گفتار", icon: "speech" },
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
  const [aiProgress, setAiProgress] = useState(0);

  const [translateText, setTranslateText] = useState("");
  const [translateResult, setTranslateResult] = useState("");
  const [translateMethod, setTranslateMethod] = useState("google");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let unlisten;
    listen("ai-log", (event) => {
      setAiLogs((current) => [...current.slice(-40), String(event.payload)]);
    }).then((cleanup) => { unlisten = cleanup; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  useEffect(() => {
    let unlisten;
    listen("ai-progress", (event) => {
      const value = Number(event.payload);
      if (Number.isFinite(value)) setAiProgress(Math.max(0, Math.min(100, Math.round(value))));
    }).then((cleanup) => { unlisten = cleanup; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const processFolder = async (folderPath) => {
    setLoading(true); setError(""); setOutputPath(""); setStats(null);
    try {
      const result = await invoke("convert_srt_to_txt", { path: folderPath });
      setOutputPath(result);
      setStats({ folderName: folderPath.replace(/\\/g, "/").split("/").pop() || folderPath, outputPath: result });
    } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  };

  const handleSelectFolder = async () => {
    setError(""); setOutputPath(""); setStats(null);
    const selected = await open({ directory: true, multiple: false, title: "انتخاب پوشه فایل‌های SRT" });
    if (!selected || Array.isArray(selected)) return;
    await processFolder(selected);
    setSelectedFolder(selected);
  };

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (!loading) setIsDragging(true); }, [loading]);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (loading) return;
    const items = e.dataTransfer.files; if (!items || items.length === 0) return;
    const firstItem = items[0];
    const path = firstItem.path || firstItem.webkitRelativePath;
    if (!path) { setError("نمی‌توان مسیر فایل را تشخیص داد."); return; }
    const parts = path.split(/[\\/]/); parts.pop();
    const folderPath = parts.join("/");
    if (folderPath) { await processFolder(folderPath); setSelectedFolder(folderPath); }
  }, [loading]);

  const handleOpenOutput = async () => {
    if (!outputPath) return;
    try { await invoke("open_output_folder", { path: outputPath }); }
    catch (err) { setError(String(err)); }
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) { setError("لطفاً متن انگلیسی را وارد کنید."); return; }
    setTranslateLoading(true); setTranslateResult(""); setError("");
    try {
      if (translateMethod === "ai") {
        const result = await invoke("translate_with_ai", { text: translateText });
        setTranslateResult(String(result));
      } else {
        const result = await invoke("translate_with_google", { text: translateText });
        setTranslateResult(String(result));
      }
    } catch (err) { setError(String(err)); }
    finally { setTranslateLoading(false); }
  };

  const handleSaveTranslation = async () => {
    if (!translateResult.trim()) { setError("متن ترجمه‌شده‌ای برای ذخیره وجود ندارد."); return; }
    setSaveLoading(true); setError("");
    try {
      const savedPath = await invoke("save_translation_dialog", { text: translateResult });
      setOutputPath(savedPath);
      setStats({ folderName: savedPath.split(/[\\/]/).pop() || savedPath, outputPath: savedPath });
    } catch (err) { setError(String(err)); }
    finally { setSaveLoading(false); }
  };

  const handleTranslateFile = async () => {
    setError(""); setTranslateLoading(true);
    try {
      const selected = await open({ multiple: false, title: "انتخاب فایل TXT یا SRT", filters: [{ name: "Text", extensions: ["txt", "srt"] }] });
      if (!selected) return;
      const result = await invoke("translate_file", { filePath: selected, method: translateMethod });
      setOutputPath(result);
      setStats({ folderName: selected.split(/[\\/]/).pop() || selected, outputPath: result });
    } catch (err) { setError(String(err)); }
    finally { setTranslateLoading(false); }
  };

  const handleTranslateFolder = async () => {
    setError(""); setTranslateLoading(true);
    try {
      const selected = await open({ directory: true, multiple: false, title: "انتخاب پوشه فایل‌های TXT/SRT" });
      if (!selected || Array.isArray(selected)) return;
      const result = await invoke("translate_folder", { folderPath: selected, method: translateMethod });
      setOutputPath(result);
      setStats({ folderName: selected.split(/[\\/]/).pop() || selected, outputPath: result });
    } catch (err) { setError(String(err)); }
    finally { setTranslateLoading(false); }
  };

  const getFileName = (fullPath) => {
    const cleaned = fullPath.replace(/\\/g, "/");
    return cleaned.split("/").pop() || cleaned;
  };

  function renderPage() {
    if (page === "converter") {
      return (
        <PageShell title="تبدیل SRT" tagline="انتخاب پوشه و تولید فایل‌های TXT خالص">
          <ConverterPanel
            selectedFolder={selectedFolder} outputPath={outputPath} error={error}
            loading={loading} stats={stats} isDragging={isDragging}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onSelectFolder={handleSelectFolder} onOpenOutput={handleOpenOutput} getFileName={getFileName}
          />
        </PageShell>
      );
    }

    if (page === "ai") {
      return (
        <PageShell title="هوش مصنوعی" tagline="دانلود، نصب و راه‌اندازی مدل ترجمه NLLB">
          <AiPage aiLogs={aiLogs} aiProgress={aiProgress} setAiProgress={setAiProgress} />
        </PageShell>
      );
    }

    if (page === "translate") {
      return (
        <PageShell title="ترجمه هوشمند" tagline="ترجمه متن انگلیسی به فارسی با هوش مصنوعی یا گوگل">
          <TranslatePage
            text={translateText} result={translateResult} loading={translateLoading} method={translateMethod}
            onTextChange={setTranslateText} onMethodChange={setTranslateMethod} onTranslate={handleTranslate}
            onTranslateFile={handleTranslateFile} onTranslateFolder={handleTranslateFolder}
            onSaveTranslation={handleSaveTranslation} saveLoading={saveLoading}
            onOpenOutput={handleOpenOutput}
            outputPath={outputPath} stats={stats} error={error} getFileName={getFileName}
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
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className="sidebar">
        <div className="sidebar-brand">
          <AppLogo />
          <div>
            <strong>دستیار هوشمند متن</strong>
            <span>نسخه دسکتاپ</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="تب‌های برنامه">
          {menuItems.map((item) => (
            <button key={item.id} type="button" className={`sidebar-item ${activePage === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
              <span className="sidebar-icon"><MenuIcon type={item.icon} /></span>
              <span>{item.title}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="theme-toggle" onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "تاریک" : "روشن"}
        </button>
      </aside>

      <main className="main-content">
        <header className="titlebar">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
          <strong>دستیار هوشمند متن</strong>
        </header>
        {children}
      </main>
    </div>
  );
}

function HomePage({ onNavigate }) {
  return (
    <div className="home-layout">
      <section className="hero-card">
        <div className="hero-content">
          <span className="hero-badge">SRT TO PLAIN TEXT</span>
          <h1>تبدیل فایل‌های SRT به متن خالص</h1>
          <p>انتخاب پوشه، حذف زمان‌بندی و موقعیت زیرنویس، و ساخت خروجی TXT آماده برای ترجمه یا پردازش.</p>
          <button type="button" className="btn btn-primary btn-large" onClick={() => onNavigate("converter")}>
            <span>ورود به ابزار تبدیل</span>
          </button>
        </div>

        <div className="hero-visual">
          <div className="visual-card">
            <span className="visual-label">SUBTITLE.SRT</span>
            <strong>زمان + موقعیت</strong>
            <p>فرمت SRT</p>
          </div>
          <div className="visual-arrow" />
          <div className="visual-card output">
            <span className="visual-label">TEXT.TXT</span>
            <strong>فقط متن</strong>
            <p>خروجی خالص</p>
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="امکانات برنامه">
        <div className="feature-card" onClick={() => onNavigate("converter")}>
          <MenuIcon type="document" />
          <h2>تبدیل SRT</h2>
          <p>تبدیل همه SRTهای داخل پوشه</p>
        </div>
        <div className="feature-card" onClick={() => onNavigate("translate")}>
          <MenuIcon type="translate" />
          <h2>ترجمه هوشمند</h2>
          <p>ترجمه متن با هوش مصنوعی یا گوگل</p>
        </div>
        <div className="feature-card" onClick={() => onNavigate("speech")}>
          <MenuIcon type="speech" />
          <h2>متن به صوت</h2>
          <p>مرور خروجی با صدای سیستم</p>
        </div>
      </section>
    </div>
  );
}

function PageShell({ title, tagline, children }) {
  return (
    <>
      <header className="page-heading-shell">
        <div>
          <span className="eyebrow">TAB</span>
          <h1>{title}</h1>
        </div>
        <p>{tagline}</p>
      </header>
      {children}
    </>
  );
}

function ConverterPanel({
  selectedFolder, outputPath, error, loading, stats, isDragging,
  onDragOver, onDragLeave, onDrop, onSelectFolder, onOpenOutput, getFileName,
}) {
  return (
    <div className="converter-grid">
      <section className={`app-card drop-zone ${isDragging ? "dragging" : ""} ${loading ? "loading" : ""}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <div className="drop-topline">
          <div className="drop-icon"><MenuIcon type="document" /></div>
          <span className="status-pill">{loading ? "در حال پردازش" : "آماده"}</span>
        </div>

        <div className="drop-copy">
          <h2>پوشه فایل‌های SRT را انتخاب کنید</h2>
          <p>برای شروع، پوشه را انتخاب یا داخل همین پنل رها کنید.</p>
        </div>

        <div className="path-box">
          <span>مسیر انتخاب‌شده</span>
          <strong>{selectedFolder || "هنوز پوشه‌ای انتخاب نشده"}</strong>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onSelectFolder} disabled={loading}>
            {loading ? <><span className="spinner" /><span>در حال تبدیل...</span></> : <><MenuIcon type="document" /><span>انتخاب پوشه</span></>}
          </button>
          {outputPath && (
            <button type="button" className="btn btn-secondary" onClick={onOpenOutput}>
              <MenuIcon type="folder" /><span>باز کردن خروجی</span>
            </button>
          )}
        </div>
      </section>

      <aside className="result-panel">
        <div className="result-header">
          <span>نتیجه</span>
          <strong>{stats ? "موفق" : "در انتظار اجرا"}</strong>
        </div>
        {stats && !error && (
          <div className="result-card success">
            <h3>تبدیل انجام شد</h3>
            <p>فایل‌های <strong>{getFileName(stats.folderName)}</strong> در <strong>{getFileName(stats.outputPath)}</strong> ذخیره شدند.</p>
          </div>
        )}
        {error && (
          <div className="result-card error">
            <h3>خطا</h3>
            <p>{error}</p>
          </div>
        )}
        {!stats && !error && (
          <div className="result-empty">
            <span>0</span>
            <p>نتیجه تبدیل بعد از انتخاب پوشه نمایش داده می‌شود.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function TranslatePage({ text, result, loading, method, onTextChange, onMethodChange, onTranslate, onTranslateFile, onTranslateFolder, onSaveTranslation, saveLoading, onOpenOutput, outputPath, stats, error, getFileName }) {
  return (
    <div className="translate-layout">
      <section className="app-card translate-card">
        <div className="translate-method-bar">
          <label className="field-label">روش ترجمه:</label>
          <div className="method-switch">
            <button type="button" className={`method-btn ${method === "google" ? "active" : ""}`} onClick={() => onMethodChange("google")}>Google Translate</button>
            <button type="button" className={`method-btn ${method === "ai" ? "active" : ""}`} onClick={() => onMethodChange("ai")}>هوش مصنوعی (NLLB)</button>
          </div>
        </div>

        <label htmlFor="translate-input" className="field-label">متن انگلیسی:</label>
        <textarea
          id="translate-input"
          className="translate-textarea"
          placeholder="متن انگلیسی خود را اینجا وارد کنید..."
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          dir="ltr"
          lang="en"
        />

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onTranslate} disabled={loading || !text.trim()}>
            {loading ? <><span className="spinner" /><span>در حال ترجمه...</span></> : <><MenuIcon type="translate" /><span>ترجمه متن</span></>}
          </button>

          {result && (
            <button type="button" className="btn btn-secondary" onClick={onSaveTranslation} disabled={saveLoading}>
              {saveLoading ? <><span className="spinner" /><span>در حال ذخیره...</span></> : <><MenuIcon type="document" /><span>ذخیره در فایل TXT</span></>}
            </button>
          )}

          <button type="button" className="btn btn-secondary" onClick={onTranslateFile} disabled={loading}>
            <MenuIcon type="document" /><span>ترجمه فایل</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={onTranslateFolder} disabled={loading}>
            <MenuIcon type="folder" /><span>ترجمه پوشه</span>
          </button>
        </div>

        {result && (
          <div className="result-block">
            <label className="field-label">نتیجه ترجمه:</label>
            <div className="result-text" dir="rtl">{result}</div>
          </div>
        )}
      </section>

      {stats && outputPath && (
        <div className="status-card success-card">
          <div className="success-icon"><MenuIcon type="success" /></div>
          <div className="success-content">
            <h3>ترجمه با موفقیت انجام شد</h3>
            <p className="success-detail">فایل در <strong>{getFileName(stats.outputPath)}</strong> ذخیره شد.</p>
            <button type="button" className="btn btn-secondary btn-small" onClick={onOpenOutput}>باز کردن پوشه</button>
          </div>
        </div>
      )}

      {error && (
        <div className="status-card error-card">
          <div className="error-icon"><MenuIcon type="error" /></div>
          <p className="error-text">{error}</p>
        </div>
      )}
    </div>
  );
}

function AiPage({ aiLogs, aiProgress, setAiProgress }) {
  const models = [{ value: "nllb-200-distilled-600M", label: "NLLB 200 Distilled 600M" }];
  const [selectedModel, setSelectedModel] = useState(models[0].value);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("مدل انتخاب‌شده آماده نصب است.");

  const handleInstall = async () => {
    setAiProgress(0); setBusy("install");
    setStatus("در حال ساخت محیط مجازی، نصب کتابخانه‌ها و دانلود مدل...");
    try { const result = await invoke("install_ai_model", { model: selectedModel }); setStatus(result); }
    catch (err) { setStatus(String(err)); }
    finally { setBusy(""); }
  };

  const handleStart = async () => {
    setAiProgress(0); setBusy("start");
    setStatus("در حال آماده‌سازی محیط مجازی و راه‌اندازی FastAPI...");
    try { const result = await invoke("start_ai_model", { model: selectedModel }); setStatus(result); }
    catch (err) { setStatus(String(err)); }
    finally { setBusy(""); }
  };

  return (
    <section className="page-card ai-panel">
      <div className="ai-content">
        <div className="ai-icon"><MenuIcon type="ai" /></div>
        <h2>مدل هوش مصنوعی</h2>
        <p>فعلاً فقط مدل NLLB 200 Distilled 600M در لیست فعال است.</p>

        <label htmlFor="ai-model" className="field-label">انتخاب مدل</label>
        <select id="ai-model" className="voice-select ai-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {models.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}
        </select>

        <div className="actions ai-actions">
          <button type="button" className="btn btn-primary" onClick={handleInstall} disabled={Boolean(busy)}>
            {busy === "install" ? "در حال دانلود..." : "دانلود مدل"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleStart} disabled={Boolean(busy)}>
            راه‌اندازی FastAPI
          </button>
        </div>

        <div className="ai-status">
          <span>{busy ? "در حال اجرا..." : "وضعیت"}</span>
          <strong>{status}</strong>
        </div>

        <div className="ai-progress">
          <div className="ai-progress-meta"><span>پیشرفت</span><strong>{aiProgress}%</strong></div>
          <div className="ai-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={aiProgress}>
            <div className="ai-progress-fill" style={{ width: `${aiProgress}%` }} />
          </div>
        </div>

        <div className="ai-log">
          <span>لاگ دانلود و نصب</span>
          <div>
            {aiLogs.length === 0 ? <p className="ai-log-empty">هنوز لاگی ثبت نشده.</p> : aiLogs.slice(-6).map((line, idx) => <p key={`${line}-${idx}`}>{line}</p>)}
          </div>
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
    const available = window.speechSynthesis?.getVoices?.() || [];
    setVoices(available);
    if (!selectedVoice && available.length > 0) {
      const faVoice = available.find((v) => /fa|persian/i.test(`${v.lang} ${v.name}`));
      setSelectedVoice((faVoice || available[0]).name);
    }
  }, [selectedVoice]);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    if (!("speechSynthesis" in window)) setMessage("این مرورگر از تبدیل متن به صوت پشتیبانی نمی‌کند.");
    return () => { window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices); };
  }, [loadVoices]);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) { setMessage("این مرورگر از تبدیل متن به صوت پشتیبانی نمی‌کند."); return; }
    if (!text.trim()) { setMessage("لطفاً متن را وارد کنید."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else { utterance.lang = "fa-IR"; }
    utterance.onstart = () => { setSpeaking(true); setMessage("در حال خواندن متن..."); };
    utterance.onend = () => { setSpeaking(false); setMessage("خواندن متن تمام شد."); };
    utterance.onerror = () => { setSpeaking(false); setMessage("در خواندن متن مشکلی پیش آمد."); };
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => { window.speechSynthesis?.cancel(); setSpeaking(false); setMessage("خواندن متن متوقف شد."); };

  return (
    <section className="page-card speech-page">
      <div className="speech-grid">
        <label htmlFor="speech-text" className="field-label">متن برای تبدیل به صوت</label>
        <textarea id="speech-text" className="speech-textarea" placeholder="متن خود را اینجا وارد کنید..." value={text} onChange={(e) => setText(e.target.value)} />

        <select className="voice-select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
          {voices.length === 0 && <option value="">بدون صدای آماده</option>}
          {voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name}</option>)}
        </select>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={handleSpeak} disabled={speaking}><span>{speaking ? "در حال خواندن..." : "خواندن متن"}</span></button>
          <button type="button" className="btn btn-secondary" onClick={handleStop} disabled={!speaking}><span>توقف</span></button>
        </div>
        {message && <p className="speech-output">{message}</p>}
      </div>
    </section>
  );
}

function AppLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
      <path d="M14 18h20M14 26h14M14 34h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MenuIcon({ type }) {
  if (type === "dashboard") {
    return <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><path d="M4 13h8V4H4v9zm12 11h8V4h-8v20zM4 24h8v-7H4v7zm12-15h8v-5h-8v5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
  }
  if (type === "ai") {
    return <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><path d="M14 3.5l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8L14 3.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M8 20.5h12M10 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  }
  if (type === "translate") {
    return <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><path d="M4 5h10M9 5c-.5 5-2.5 9-6 12M4 5c1.5 5 4 9 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 8h8M16 12h6M18 8l-4 10M20 13l4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "speech") {
    return <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><path d="M5 10v6h4l5 4V6l-5 4H5zM17 12a4 4 0 010 4M19.5 9.5a7 7 0 010 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "success") {
    return <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" /><path d="M8 14l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "error") {
    return <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" /><path d="M9 9l10 10M19 9L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>;
  }
  if (type === "folder") {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <path d="M8 5h10l4 4v14H8V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 5v5h5M10 13h8M10 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default App;
