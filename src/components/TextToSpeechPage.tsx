import { useCallback, useEffect, useState } from "react";

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
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
