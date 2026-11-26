"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
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
  const [showPart12Content, setShowPart12Content] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentId, setCurrentId] = useState(1);
  // Chặn auto-save ghi đáp án cũ trở lại trong chu kỳ fresh-reset của StrictMode
  // (effect chạy 2 lần; lần 1 đã reset + clearDraft, lần 2 chỉ khôi phục state cũ).
  const freshResetRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const page = pageRef.current;
    const toolbar = toolbarRef.current;
    if (!page || !toolbar) return;
    const partHeaders = page.querySelectorAll<HTMLElement>("[data-practice-part-header]");
    const bottomBar = page.querySelector<HTMLElement>("[data-practice-bottom-bar]");
    const updateSizes = () => {
      page.style.setProperty("--practice-toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
      page.style.setProperty("--practice-bottom-bar-height", `${bottomBar?.getBoundingClientRect().height ?? 0}px`);
      for (const header of partHeaders) {
        header.parentElement?.style.setProperty("--practice-part-height", `${header.getBoundingClientRect().height}px`);
      }
    };
    updateSizes();
    const observer = new ResizeObserver(updateSizes);
    observer.observe(toolbar);
    if (bottomBar) observer.observe(bottomBar);
    partHeaders.forEach((header) => observer.observe(header));
    return () => observer.disconnect();
  }, []);

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
      setShowPart12Content(false);
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
    window.requestAnimationFrame(() => {
      const question = document.getElementById(`q-${id}`);
      question?.focus({ preventScroll: true });
      question?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
        tabIndex={-1}
        aria-label={`Câu ${q.id}`}
        className="min-w-0 scroll-mt-[calc(var(--practice-toolbar-height,57px)+var(--practice-part-height,80px)+0.75rem)] rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lift sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
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
            const showContent = q.part > 2 || showPart12Content;
            return (
              <label
                key={opt.key}
                className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm leading-6 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  selected
                    ? "border-brand bg-brand-soft font-semibold text-brand-dark"
                    : "border-line bg-paper hover:border-brand"
                }`}
              >
                <input
                  type="radio"
                  name={`listening-question-${q.id}`}
                  value={opt.key}
                  checked={selected}
                  onChange={() => selectAnswer(q.id, opt.key)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    selected
                      ? "animate-option-pop border-brand bg-brand text-white"
                      : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {opt.key}
                </span>
                {showContent && <span className="min-w-0 [overflow-wrap:anywhere]">{opt.text}</span>}
              </label>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div ref={pageRef} className="animate-page-enter flex min-h-screen flex-col bg-paper supports-[height:100dvh]:min-h-dvh">
      {/* Header dính — slim, giữ timer & controls */}
      <header ref={toolbarRef} className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-4">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="flex min-h-[44px] min-w-[44px] items-center gap-2" aria-label="TOEIC REVISION — Trang chủ">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand font-display text-[11px] font-bold text-white">TR</span>
              <span className="hidden text-xs font-bold uppercase tracking-wider text-brand-dark sm:inline">Listening Revision</span>
            </Link>
            <Link href="/review" className="hidden min-h-[44px] items-center text-xs font-bold text-brand-dark hover:underline sm:inline-flex" aria-label="Ôn tập Listening">
              Ôn tập
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1.5" aria-label="Thời gian còn lại">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="hidden text-ink-soft sm:block">
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
              className="min-h-[44px] min-w-[44px] rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink hover:border-brand"
            >
              {timerOn ? "Tắt giờ" : "Bật giờ"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="ml-auto min-h-[44px] shrink-0 rounded-lg bg-[#d97706] px-3 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-card active:scale-[0.98]"
          >
            Nộp bài
          </button>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:flex-1">
            <div className="flex min-w-0 flex-1 items-stretch rounded-lg border border-line bg-white p-0.5 text-[11px] font-bold sm:flex-none sm:text-xs" role="group" aria-label="Cách hiển thị lựa chọn Part I–II">
              <button
                type="button"
                onClick={() => setShowPart12Content(false)}
                aria-pressed={!showPart12Content}
                aria-label="Chỉ hiện A/B/C/D"
                className={`min-h-[44px] min-w-[44px] flex-1 rounded-md px-2 py-1.5 ${!showPart12Content ? "bg-brand text-white" : "text-ink-soft hover:text-brand-dark"}`}
              >
                <span className="sm:hidden">Chỉ A/B/C/D</span>
                <span className="hidden sm:inline">Chỉ hiện A/B/C/D</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPart12Content(true)}
                aria-pressed={showPart12Content}
                aria-label="A/B/C/D kèm nội dung"
                className={`min-h-[44px] min-w-[44px] flex-1 rounded-md px-2 py-1.5 ${showPart12Content ? "bg-brand text-white" : "text-ink-soft hover:text-brand-dark"}`}
              >
                <span className="sm:hidden">Kèm nội dung</span>
                <span className="hidden sm:inline">A/B/C/D kèm nội dung</span>
              </button>
            </div>
            <div className="flex shrink-0 items-center rounded-lg border border-line bg-white p-0.5 text-xs font-bold" role="group" aria-label="Tốc độ đọc">
              {([0.8, 1] as SpeechRate[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  aria-pressed={rate === r}
                  className={`min-h-[44px] min-w-[44px] rounded-md px-2 py-1.5 ${rate === r ? "bg-brand text-white" : "text-ink-soft"}`}
                >
                  {r === 0.8 ? "0.8x" : "1.0x"}
                </button>
              ))}
            </div>
            <span className="hidden text-xs text-ink-soft lg:inline">
              {savedAt
                ? `Đã lưu nháp lúc ${new Date(savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Chưa có thay đổi"}
            </span>
          </div>
        </div>
      </header>

      {/* Nội dung chính + sidebar desktop — khung giấy đề thi */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-3 py-4 pb-[calc(var(--practice-bottom-bar-height,80px)+1rem)] sm:px-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-10">
        <div className="animate-fade-in flex min-w-0 flex-col gap-6">
          {PART_META.map((meta) => (
            <div key={meta.part}>
              <div data-practice-part-header className="sticky top-[var(--practice-toolbar-height,57px)] z-30 -mx-3 border-b border-line bg-gradient-to-r from-paper-deep/95 via-paper/95 to-paper-deep/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-1 lg:px-1">
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
          <div className="sticky top-[calc(var(--practice-toolbar-height,57px)+1rem)] flex max-h-[calc(100vh-var(--practice-toolbar-height,57px)-2rem-env(safe-area-inset-bottom))] flex-col rounded-2xl border border-line bg-white p-4 shadow-card supports-[height:100dvh]:max-h-[calc(100dvh-var(--practice-toolbar-height,57px)-2rem-env(safe-area-inset-bottom))]">
            <QuestionPanel answers={answers} flags={flags} currentId={currentId} onJump={jumpTo} />
          </div>
        </aside>
      </div>

      {/* Bottom bar mobile */}
      <div data-practice-bottom-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-paper/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-2">
          <span className="min-w-0 text-xs font-semibold text-ink">
            Đã làm <span className="font-tabular">{answeredCount}/{TOTAL_QUESTIONS}</span>
            {unanswered > 0 && <span className="text-bad"> · {unanswered} chưa làm</span>}
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-brand bg-white px-3 py-2.5 text-sm font-bold text-brand-dark"
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
      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        label="Bảng điều hướng 100 câu hỏi Listening"
        className="items-center justify-end pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[max(1rem,env(safe-area-inset-top))]"
      >
        <div className="animate-fade-up flex max-h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-sheet">
          <QuestionPanel
            answers={answers}
            flags={flags}
            currentId={currentId}
            onJump={jumpTo}
            showHandle
            onClose={() => setSheetOpen(false)}
          />
        </div>
      </Modal>

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
