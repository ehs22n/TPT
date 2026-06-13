import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

function App() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="app">
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      <main className="main-content">
        <header className="header">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
              <path
                d="M14 18h20M14 26h14M14 34h10"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1>تبدیل‌کننده SRT</h1>
              <p className="tagline">فایل‌های زیرنویس را به متن تبدیل کنید</p>
            </div>
          </div>
        </header>

        <section
          className={`drop-zone ${isDragging ? "dragging" : ""} ${loading ? "loading" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect
                x="8"
                y="12"
                width="40"
                height="32"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 28l12-12h24l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 36v-8a8 8 0 0116 0v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3>پوشه را اینجا بکشید</h3>
          <p className="drop-hint">
            یا برای انتخاب پوشه از دکمه زیر استفاده کنید
          </p>

          <input
            type="text"
            readOnly
            className="path-input"
            placeholder={loading ? "در حال پردازش..." : "مسیر پوشه انتخاب‌شده"}
            value={selectedFolder}
          />

          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSelectFolder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>در حال تبدیل...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M2 10a6 6 0 0111.5-2.5M2 10a6 6 0 019.5 3M2 10h2m12 0h2M4 16v-2a6 6 0 0112 0v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>انتخاب پوشه</span>
                </>
              )}
            </button>

            {outputPath && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenOutput}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 10h14M10 3v7l4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>باز کردن پوشه خروجی</span>
              </button>
            )}
          </div>

          {isDragging && (
            <div className="drag-overlay">
              <p>پوشه را اینجا رها کنید</p>
            </div>
          )}
        </section>

        {stats && !error && (
          <div className="success-card">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 14l4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="success-content">
              <h3>تبدیل با موفقیت انجام شد</h3>
              <p className="success-detail">
                فایل‌های پوشه <strong>{getFileName(stats.folderName)}</strong> در
                <strong>{getFileName(stats.outputPath)}</strong> ذخیره شدند.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <div className="error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 8v4m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="error-text">{error}</p>
          </div>
        )}

        <footer className="footer">
          <p>فایل‌های .srt را به .txt تبدیل می‌کند · متن خالص زیرنویس</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
