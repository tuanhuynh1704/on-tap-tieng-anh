"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import QuestionPanel from "@/components/QuestionPanel";
import SpeakButton from "@/components/SpeakButton";
import {
  PART_META,
  QUESTIONS,
  TOTAL_QUESTIONS,
  getGroupForQuestion,
  type ExamQuestion,
} from "@/data/exam";
import { speechTextForQuestion, type SpeechRate } from "@/lib/tts";
import { clearDraft, loadDraft, saveAttempt, saveDraft } from "@/lib/storage";

const TOTAL_SECONDS = 45 * 60;

// isomorphic: trên server chạy useEffect, trên client chạy useLayoutEffect (trước paint).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function formatTime(total: number): string {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function PracticePage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<number[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [timerOn, setTimerOn] = useState(true);
  const [rate, setRate] = useState<SpeechRate>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentId, setCurrentId] = useState(1);
  // Chặn auto-save ghi đáp án cũ trở lại trong chu kỳ fresh-reset của StrictMode
  // (effect chạy 2 lần; lần 1 đã reset + clearDraft, lần 2 chỉ khôi phục state cũ).
  const freshResetRef = useRef(false);

  // Đối chiếu draft mỗi lần trang trở nên hiển thị — Activity của Next giữ state/DOM
  // khi điều hướng, nên layout effect chạy lại khi Activity hiện:
  // có draft → khôi phục; không có draft → reset toàn bộ lượt làm bài mới.
  useIsomorphicLayoutEffect(() => {
    const draft = loadDraft();
    const hasDraftContent = !!draft && (Object.keys(draft.answers).length > 0 || draft.flags.length > 0);
    if (hasDraftContent) {
      freshResetRef.current = false;
      setAnswers(draft.answers);
      setFlags(draft.flags);
      setSavedAt(draft.savedAt);
    } else {
      freshResetRef.current = true;
      setAnswers({});
      setFlags([]);
      setSavedAt(null);
      setTimeLeft(TOTAL_SECONDS);
      setTimerOn(true);
      setCurrentId(1);
      setSheetOpen(false);
      setConfirmOpen(false);
      clearDraft();
    }
    setHydrated(true);
  }, []);

  // Auto-save draft khi answers/flags đổi (sau khi đã hydrate)
  useEffect(() => {
    if (!hydrated) return;
    // Luôn chặn khi đang ở lượt mới (StrictMode chạy 2 lần: lần đầu có closure
    // answers cũ → chặn để không ghi draft cũ trở lại).
    if (freshResetRef.current) return;
    const d = saveDraft(answers, flags);
    setSavedAt(d.savedAt);
  }, [answers, flags, hydrated]);

  // Đồng hồ đếm ngược 45:00
  useEffect(() => {
    if (!timerOn || !hydrated) return;
    if (timeLeft <= 0) return;
    const t = window.setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(t);
  }, [timerOn, hydrated, timeLeft]);

  // Hết giờ → tự nộp
  useEffect(() => {
    if (hydrated && timeLeft === 0) {
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, timeLeft]);

  const answeredCount = useMemo(
    () => QUESTIONS.filter((q) => answers[q.id]).length,
    [answers]
  );
  const unanswered = TOTAL_QUESTIONS - answeredCount;

  function doSubmit() {
    const attempt = saveAttempt(answers);
    clearDraft();
    router.push(`/results?id=${attempt.id}`);
  }

  function toggleFlag(id: number) {
    freshResetRef.current = false;
    setFlags((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function selectAnswer(id: number, key: string) {
    freshResetRef.current = false;
    setAnswers((prev) => ({ ...prev, [id]: key }));
  }

  function jumpTo(id: number) {
    setCurrentId(id);
    setSheetOpen(false);
    document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion(q: ExamQuestion) {
    const group = getGroupForQuestion(q);
    const chosen = answers[q.id];
    const flagged = flags.includes(q.id);
    const speechText = speechTextForQuestion(q, group);
    const isPart1 = q.part === 1;

    return (
      <section
        key={q.id}
        id={`q-${q.id}`}
        aria-label={`Câu ${q.id}`}
        className="scroll-mt-24 rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lift sm:p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white font-tabular shadow-sm">
              {q.id}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Part {q.part}
            </span>
            {q.graphic && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-dark">
                Graphic
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SpeakButton text={speechText} rate={rate} label="Nghe" />
            <button
              type="button"
              onClick={() => toggleFlag(q.id)}
              aria-pressed={flagged}
              aria-label={flagged ? `Bỏ đánh dấu câu ${q.id}` : `Đánh dấu câu ${q.id}`}
              title={flagged ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors min-h-[44px] min-w-[44px] ${
                flagged
                  ? "border-accent bg-accent-soft text-accent-dark"
                  : "border-line bg-white text-ink-soft hover:border-accent hover:text-accent-dark"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={flagged ? "currentColor" : "none"} aria-hidden="true">
                <path d="M6 21V4m0 1h12l-3 4.5L18 14H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {isPart1 && q.image && (
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-paper">
            <Image
              src={q.image}
              alt={q.imageAlt ?? `Bức tranh câu ${q.id}`}
              width={1200}
              height={900}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          </div>
        )}

        {q.prompt && <p className="mt-3 font-semibold leading-6 text-ink">{q.prompt}</p>}

        {q.graphic && (
          <div className="mt-3 overflow-hidden rounded-xl border border-accent/50 bg-accent-soft/40">
            <Image
              src={q.graphic}
              alt={q.graphicAlt ?? `Graphic cho câu ${q.id}`}
              width={1200}
              height={800}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={`Câu ${q.id} — chọn đáp án`}>
          {q.options.map((opt) => {
            const selected = chosen === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectAnswer(q.id, opt.key)}
                className={`flex min-h-[44px] items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm leading-6 transition-colors ${
                  selected
                    ? "border-brand bg-brand-soft font-semibold text-brand-dark"
                    : "border-line bg-paper hover:border-brand"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    selected
                      ? "animate-option-pop border-brand bg-brand text-white"
                      : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {opt.key}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Header dính — slim, giữ timer & controls */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" aria-label="TOEIC REVISION — Trang chủ">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand font-display text-[11px] font-bold text-white">TR</span>
              <span className="hidden text-xs font-bold uppercase tracking-wider text-brand-dark sm:inline">Listening Revision</span>
            </Link>
            <Link href="/review" className="hidden text-xs font-bold text-brand-dark hover:underline sm:inline" aria-label="Ôn tập Listening">
              Ôn tập
            </Link>
          </div>
          <div className="flex items-center gap-2" aria-label="Thời gian còn lại">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-soft">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span role="timer" className={`font-display text-xl font-bold font-tabular ${timeLeft <= 300 ? "text-bad" : "text-ink"}`}>
              {formatTime(timeLeft)}
            </span>
            <button
              type="button"
              onClick={() => setTimerOn((v) => !v)}
              aria-pressed={timerOn}
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand min-h-[36px]"
            >
              {timerOn ? "Tắt giờ" : "Bật giờ"}
            </button>
          </div>
          <span className="hidden text-xs text-ink-soft sm:inline">
            {savedAt
              ? `Đã lưu nháp lúc ${new Date(savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Chưa có thay đổi"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-line bg-white p-0.5 text-xs font-bold" aria-label="Tốc độ đọc">
              {([0.8, 1] as SpeechRate[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  aria-pressed={rate === r}
                  className={`rounded-md px-2.5 py-1.5 min-h-[36px] ${rate === r ? "bg-brand text-white" : "text-ink-soft"}`}
                >
                  {r === 0.8 ? "0.8x" : "1.0x"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-[#d97706] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-card min-h-[44px] active:scale-[0.98]"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính + sidebar desktop — khung giấy đề thi */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-3 py-4 pb-28 sm:px-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-10">
        <div className="animate-fade-in flex flex-col gap-6">
          {PART_META.map((meta) => (
            <div key={meta.part}>
              <div className="sticky top-[57px] z-30 -mx-3 border-b border-line bg-gradient-to-r from-paper-deep/95 via-paper/95 to-paper-deep/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-1 lg:px-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-dark">
                  {meta.nameVi} · {meta.range}
                </h2>
                <p className="text-[11px] text-ink-soft">
                  {meta.part === 1 && "Nhìn ảnh, nghe 4 mệnh đề và chọn mệnh đề mô tả đúng. Đề chỉ phát một lần."}
                  {meta.part === 2 && "Nghe câu hỏi/câu nói và chọn phản hồi phù hợp nhất."}
                  {meta.part === 3 && "Nghe hội thoại và trả lời 3 câu hỏi cho mỗi đoạn."}
                  {meta.part === 4 && "Nghe bài nói và trả lời 3 câu hỏi cho mỗi bài."}
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {QUESTIONS.filter((q) => q.part === meta.part).map(renderQuestion)}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-line bg-paper-deep p-4 text-center shadow-card">
            <p className="text-sm font-semibold text-ink">
              Đã trả lời {answeredCount}/{TOTAL_QUESTIONS} câu{unanswered > 0 ? ` — còn ${unanswered} câu chưa trả lời` : ""}
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="mt-3 w-full rounded-xl bg-[#d97706] px-6 py-3 text-base font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-card min-h-[48px] active:scale-[0.98]"
            >
              Nộp bài và chấm điểm
            </button>
          </div>
        </div>

        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-[73px] rounded-2xl border border-line bg-white p-4 shadow-card">
            <QuestionPanel answers={answers} flags={flags} currentId={currentId} onJump={jumpTo} />
          </div>
        </aside>
      </div>

      {/* Bottom bar mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-paper/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <span className="text-xs font-semibold text-ink">
            Đã làm <span className="font-tabular">{answeredCount}/{TOTAL_QUESTIONS}</span>
            {unanswered > 0 && <span className="text-bad"> · {unanswered} chưa làm</span>}
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-brand bg-white px-4 py-2.5 text-sm font-bold text-brand-dark min-h-[44px]"
            aria-expanded={sheetOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Bảng câu hỏi
          </button>
        </div>
      </div>

      {/* Bottom sheet mobile */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Bảng điều hướng câu hỏi">
          <div className="navigator-scroll animate-fade-up mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 shadow-sheet">
            <QuestionPanel
              answers={answers}
              flags={flags}
              currentId={currentId}
              onJump={jumpTo}
              showHandle
              onClose={() => setSheetOpen(false)}
              gridClassName=""
            />
          </div>
        </div>
      )}

      {/* Modal xác nhận nộp bài */}
      <ConfirmDialog
        open={confirmOpen}
        title="Nộp bài?"
        message={
          <>
            Bạn đã trả lời <strong className="text-ink">{answeredCount}/{TOTAL_QUESTIONS}</strong> câu.
            {unanswered > 0 ? (
              <> Còn <strong className="text-bad">{unanswered} câu chưa trả lời</strong> — các câu trống sẽ được tính là sai.</>
            ) : (
              <> Toàn bộ câu hỏi đã được trả lời.</>
            )}
            {flags.length > 0 && (
              <> Bạn đang đánh dấu cờ <strong className="text-accent-dark">{flags.length} câu</strong> để xem lại (câu {flags.slice().sort((a, b) => a - b).join(", ")}).</>
            )}
          </>
        }
        confirmLabel="Nộp bài"
        onConfirm={doSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
