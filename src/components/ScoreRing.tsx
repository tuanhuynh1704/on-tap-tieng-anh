"use client";

import { useEffect, useState } from "react";

export default function ScoreRing({ raw, size = 200 }: { raw: number; size?: number }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, raw / 100));
  const targetOffset = circumference * (1 - fraction);

  const [mounted, setMounted] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setMounted(true);
    let current = 0;
    const step = Math.max(1, Math.ceil(raw / 25)); // ~25 bước × 40ms ≈ 1s
    const timer = window.setInterval(() => {
      current = Math.min(raw, current + step);
      setDisplay(current);
      if (current >= raw) window.clearInterval(timer);
    }, 40);
    return () => window.clearInterval(timer);
  }, [raw]);

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`Điểm raw ${raw} trên 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-paper-deep)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-brand)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? targetOffset : circumference}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-5xl font-bold font-tabular text-brand-dark">{display}</span>
        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">/ 100 raw</span>
      </div>
    </div>
  );
}
