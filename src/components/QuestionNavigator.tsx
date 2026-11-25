"use client";

import { PART_META, QUESTIONS, type PartNumber } from "@/data/exam";

/** Tên ngắn cho header của từng Part. */
const PART_SHORT: Record<PartNumber, string> = {
  1: "Ảnh",
  2: "Hội thoại ngắn",
  3: "Hội thoại",
  4: "Bài nói",
};

/** Chiều rộng ô vuông — shared cho Listening/Reading. */
export interface NavQuestionRef {
  id: number;
  part: number;
}

/** Mỗi Part một nhóm, có tên ngắn để dùng ở header + aria. */
export interface NavPartMeta {
  part: number;
  short: string;
}

const DEFAULT_PARTS: NavPartMeta[] = PART_META.map((m) => ({ part: m.part, short: PART_SHORT[m.part] }));

export default function QuestionNavigator({
  answers,
  flags,
  currentId,
  onJump,
  questions,
  parts,
  ariaLabel = "Bản đồ câu hỏi theo từng Part",
}: {
  answers: Record<number, string>;
  flags: number[];
  currentId: number;
  onJump: (id: number) => void;
  /** Mặc định: dữ liệu Listening. Reading truyền dữ liệu READING_QUESTIONS. */
  questions?: NavQuestionRef[];
  /** Mặc định: Listening PART_META. */
  parts?: NavPartMeta[];
  ariaLabel?: string;
}) {
  const flagSet = new Set(flags);
  const navQuestions = questions ?? (QUESTIONS as unknown as NavQuestionRef[]);
  const navParts = parts ?? DEFAULT_PARTS;

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className="flex flex-col"
    >
      {navParts.map((meta, partIndex) => {
        const partQuestions = navQuestions.filter((q) => q.part === meta.part);
        const answeredInPart = partQuestions.filter((q) => Boolean(answers[q.id])).length;
        const complete = answeredInPart === partQuestions.length;

        return (
          <section
            key={meta.part}
            aria-label={`Part ${meta.part} · ${meta.short}`}
            className={partIndex > 0 ? "mt-2.5 border-t border-line/70 pt-2.5" : ""}
          >
            {/* Header nhỏ của Part — không có khung riêng */}
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-brand-dark">
                P{meta.part} · {meta.short}
              </h3>
              <span
                className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-bold font-tabular ${
                  complete ? "text-ok" : "text-ink-soft"
                }`}
              >
                {answeredInPart}/{partQuestions.length}
                {complete && (
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-label="Đã hoàn thành"
                    role="img"
                  >
                    <path
                      d="m5 12.5 4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-2.5">
              {partQuestions.map((q) => {
                const answered = Boolean(answers[q.id]);
                const flagged = flagSet.has(q.id);
                const isCurrent = currentId === q.id;

                const base =
                  "relative flex aspect-square min-h-[44px] min-w-[44px] w-full items-center justify-center rounded-md border text-xs font-bold font-tabular transition-[transform,box-shadow,border-color,background-color] focus-visible:z-20";

                let tone: string;
                if (answered && flagged) {
                  tone =
                    "border-brand-dark/30 bg-linear-to-br from-brand to-brand-dark text-white shadow-sm shadow-brand/30";
                } else if (answered) {
                  tone =
                    "border-brand-dark/20 bg-linear-to-br from-brand to-brand-dark text-white shadow-sm shadow-brand/30";
                } else if (flagged) {
                  tone = "border-accent bg-accent-soft text-accent-dark";
                } else {
                  tone =
                    "border-line bg-white text-ink-soft hover:-translate-y-px hover:border-brand hover:text-brand-dark";
                }

                // Vòng "hiện tại" nằm ngoài cùng; ring/outline không ảnh hưởng layout box
                let currentRing = "";
                if (isCurrent) {
                  currentRing =
                    answered && flagged
                      ? "z-10 outline outline-2 outline-offset-2 outline-ink"
                      : "z-10 ring-2 ring-ink";
                }

                const stateLabel = [
                  isCurrent ? "hiện tại" : null,
                  answered ? "đã trả lời" : "chưa làm",
                  flagged ? "đã đánh cờ" : null,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onJump(q.id)}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-label={`Câu ${q.id} — ${stateLabel}`}
                    className={`${base} ${tone} ${currentRing}`}
                  >
                    {q.id}
                    {flagged && (
                      <svg
                        className="pointer-events-none absolute -right-1 -top-1 h-3.5 w-3.5 text-accent"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 21V4m0 1h12l-3 4.5L18 14H6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
