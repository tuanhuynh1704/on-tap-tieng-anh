"use client";

import QuestionNavigator, { type NavPartMeta, type NavQuestionRef } from "@/components/QuestionNavigator";
import { QUESTIONS, TOTAL_QUESTIONS } from "@/data/exam";

/**
 * Panel "Bảng câu hỏi" dùng chung cho sidebar desktop và bottom sheet mobile.
 * Gồm: header (tiêu đề + x/100), progress bar, legend dạng swatch ô,
 * nút "Đến câu chưa làm" và lưới điều hướng (có thể cuộn).
 */
export default function QuestionPanel({
  answers,
  flags,
  currentId,
  onJump,
  showHandle = false,
  onClose,
  gridClassName = "navigator-scroll min-h-16 flex-1 overflow-y-auto overscroll-contain p-1.5 [@media(max-height:480px)]:flex-none [@media(max-height:480px)]:overflow-visible",
  questions,
  parts,
  total = TOTAL_QUESTIONS,
  ariaLabel = "Bản đồ câu hỏi theo từng Part",
}: {
  answers: Record<number, string>;
  flags: number[];
  currentId: number;
  onJump: (id: number) => void;
  showHandle?: boolean;
  onClose?: () => void;
  gridClassName?: string;
  /** Mặc định: dữ liệu Listening. Reading truyền READING_QUESTIONS. */
  questions?: NavQuestionRef[];
  /** Mặc định: Listening. */
  parts?: NavPartMeta[];
  total?: number;
  ariaLabel?: string;
}) {
  const navQuestions = questions ?? (QUESTIONS as unknown as NavQuestionRef[]);
  const answeredCount = navQuestions.filter((q) => answers[q.id]).length;
  const progressPercent = Math.round((answeredCount / total) * 100);
  const firstUnansweredId = navQuestions.find((q) => !answers[q.id])?.id ?? null;

  return (
    <div className="navigator-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      {/* Tay cầm + nút đóng (chỉ dùng cho bottom sheet) */}
      {showHandle && (
        <div className="relative mb-3 flex h-11 shrink-0 items-center justify-center">
          <span className="mx-auto h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng câu hỏi"
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand-dark min-h-[44px] min-w-[44px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Hàng 1 — tiêu đề + x/100 lớn */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Bảng câu hỏi
        </h2>
        <span className="text-lg font-extrabold font-tabular leading-none text-brand-dark">
          {answeredCount}/{total}
        </span>
      </div>

      {/* Hàng 2 — progress bar mảnh + % */}
      <div
        className="mt-3 shrink-0"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
        aria-label="Tiến độ trả lời"
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] font-semibold font-tabular text-ink-soft">
          {progressPercent}%
        </div>
      </div>

      {/* Lưới cuộn riêng; viewport thấp cuộn toàn panel để giữ đủ nội dung. */}
      <div className={`mt-3 ${gridClassName}`}>
        <QuestionNavigator
          answers={answers}
          flags={flags}
          currentId={currentId}
          onJump={onJump}
          questions={questions}
          parts={parts}
          ariaLabel={ariaLabel}
        />
      </div>

      {/* Legend dạng swatch ô + nút "Đến câu chưa làm" */}
      <div className="mt-3 shrink-0 border-t border-line/70 pt-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-ink-soft">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded border border-line bg-white" aria-hidden="true" />
            Chưa làm
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded border border-brand-dark/20 bg-gradient-to-br from-brand to-brand-dark" aria-hidden="true" />
            Đã chọn
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded border border-accent bg-accent-soft" aria-hidden="true" />
            Đã cờ
          </li>
        </ul>
        <button
          type="button"
          onClick={() => firstUnansweredId !== null && onJump(firstUnansweredId)}
          disabled={firstUnansweredId === null}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-xs font-extrabold text-accent-dark transition-colors hover:border-accent-dark hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M12 19l-5-5M12 19l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Đến câu chưa làm
        </button>
      </div>
    </div>
  );
}
