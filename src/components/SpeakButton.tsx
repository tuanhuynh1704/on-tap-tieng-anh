"use client";

import { useEffect, useState } from "react";
import { isTtsSupported, speak, stopSpeaking, type SpeechRate } from "@/lib/tts";

export default function SpeakButton({
  text,
  rate,
  label = "Nghe",
  className = "",
}: {
  text: string;
  rate: SpeechRate;
  label?: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(isTtsSupported());
    return () => stopSpeaking();
  }, []);

  if (!supported) {
    return (
      <p className="text-xs text-ink-soft italic">
        Trình duyệt không hỗ trợ Web Speech API — không thể nghe bằng máy.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (speaking) {
          stopSpeaking();
          setSpeaking(false);
        } else {
          speak(text, rate);
          setSpeaking(true);
          // speechSynthesis không có event đáng tin cậy mọi nơi — tự tắt trạng thái sau ước lượng thời lượng
          const est = Math.max(2000, (text.length / 12) * (rate === 0.8 ? 1.25 : 1) * 1000);
          window.setTimeout(() => setSpeaking(false), est);
        }
      }}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-dark hover:bg-brand hover:text-white transition-colors min-h-[44px] ${className}`}
      aria-pressed={speaking}
      aria-label={speaking ? "Dừng nghe" : label}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {speaking ? "Dừng" : label}
    </button>
  );
}
