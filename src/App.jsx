import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { AppLayout } from "./components/AppLayout";
import HomePage, { PlaceholderPage } from "./components/HomePage";
import PageShell from "./components/PageShell";
import ConverterPanel from "./components/ConverterPanel";
import AiPage from "./components/AiPage";
import TextToSpeechPage from "./components/TextToSpeechPage";

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

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loading) setIsDragging(true);
    },
    [loading]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
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

      const parts = filePath.split(/[\/]/);
      parts.pop();
      const folderPath = parts.join("/");

      if (folderPath) {
        await processFolder(folderPath);
        setSelectedFolder(folderPath);
      }
    },
    [loading]
  );

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
            items={["ورود متن یا فایل متنی", "انتخاب زبان مبدأ و مقصد", "دریافت ترجمه روان و قابل ویرایش"]}
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
    <AppLayout activePage={page} theme={theme} onThemeChange={setTheme} onNavigate={setPage} menuItems={menuItems}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
