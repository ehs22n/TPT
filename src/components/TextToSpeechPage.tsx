import { useCallback, useEffect, useState } from "react";
import { Button, SelectBox, TextArea } from "./shared";

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



    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, [loadVoices]);

  function handleSpeak() {

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
        <TextArea
          id="speech-text"
          placeholder="متن خود را اینجا وارد کنید..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <SelectBox
          className="min-h-[42px]"
          value={selectedVoice}
          options={voices.length ? voices.map((voice) => ({ value: voice.name, label: voice.name })) : [{ value: "", label: "بدون صدای آماده", disabled: true }]}
          placeholder="انتخاب صدا"
          onChange={(value) => setSelectedVoice(value)}
        />

        <div className="relative z-10 flex mt-3 flex-wrap gap-[10px] max-[760px]:w-full">
          <Button type="button" variant="primary" className="max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleSpeak} disabled={speaking}>
            <span>{speaking ? "در حال خواندن..." : "خواندن متن"}</span>
          </Button>

          <Button type="button" variant="secondary" className="max-[900px]:flex-[1_1_auto] max-[760px]:flex-[1_1_100%]" onClick={handleStop} disabled={!speaking}>
            <span>توقف</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
