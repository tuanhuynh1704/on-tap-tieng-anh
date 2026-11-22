"use client";

import { useEffect, useState } from "react";
import { PART_META } from "@/data/exam";

/** Item đơn lẻ: {part, correct, total}. */
export interface BreakdownItem {
  part: number;
  correct: number;
  total: number;
}

/** Meta cho mỗi Part: {part, name}. Mặc định Listening PART_META. */
export interface BreakdownMeta {
  part: number;
  name: string;
}

export default function PartBreakdown({
  items,
  meta,
}: {
  items: BreakdownItem[];
  meta?: BreakdownMeta[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const parts = meta ?? PART_META.map(({ part, name }) => ({ part, name }));

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ part, correct, total }, index) => {
        const meta = parts.find((m) => m.part === part)!;
        const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
        return (
          <div key={part}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold text-ink">{meta.name}</span>
              <span className="font-tabular text-ink-soft">
                {correct}/{total} đúng · {pct}%
              </span>
            </div>
            <div
              className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-paper-deep"
              role="progressbar"
              aria-valuenow={correct}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${meta.name}: ${correct} trên ${total} câu đúng`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-[800ms] ease-out motion-reduce:transition-none ${
                  pct >= 70 ? "bg-brand" : pct >= 40 ? "bg-accent" : "bg-bad"
                }`}
                style={{ width: mounted ? `${pct}%` : "0%", transitionDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
