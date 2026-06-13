import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

function App() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [outputFolder, setOutputFolder] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSelectFolder() {
    setError("");
    setOutputFolder("");

    const selected = await open({
      directory: true,
      multiple: false,
      title: "انتخاب پوشه",
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    setSelectedFolder(selected);
    setLoading(true);

    try {
      const result = await invoke("convert_srt_to_txt", { path: selected });
      setOutputFolder(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" />

      <section className="content">
        <div className="center-panel">
          <h1>تبدیل SRT به TXT</h1>
          <p className="hint">پوشه‌ای را انتخاب کنید که فایل‌های SRT داخل آن قرار دارند.</p>

          <button type="button" onClick={handleSelectFolder} disabled={loading}>
            {loading ? "در حال تبدیل..." : "انتخاب پوشه"}
          </button>

          {selectedFolder && (
            <p className="path selected">
              پوشه انتخاب‌شده:
              <span>{selectedFolder}</span>
            </p>
          )}

          {outputFolder && (
            <p className="path success">
              خروجی ساخته‌شده:
              <span>{outputFolder}</span>
            </p>
          )}

          {error && <p className="path error">خطا: {error}</p>}
        </div>
      </section>
    </main>
  );
}

export default App;
