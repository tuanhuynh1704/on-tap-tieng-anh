"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PartBreakdown, { type BreakdownMeta } from "@/components/PartBreakdown";
import ReadingDocumentCard from "@/components/ReadingDocumentCard";
import ScoreRing from "@/components/ScoreRing";
import SiteHeader from "@/components/SiteHeader";
import {
  READING_PASSAGES,
  READING_PART_META,
  READING_QUESTIONS,
  getReadingQuestionById,
  type ReadingPassage,
  type ReadingQuestion,
} from "@/data/reading";
import { formatScaledScore, weakestPart } from "@/lib/scoring";
import { clearDraft, getAttempt, getPreviousAttempt, loadHistory } from "@/lib/reading-storage";

const READING_BREAKDOWN_META: BreakdownMeta[] = READING_PART_META.map(({ part, name }) => ({ part, name }));

const READING_ADVICE: Record<5 | 6 | 7, string> = {
  5: "Ôn lại Part 5: chú ý thì hiện tại tiếp diễn, động từ nguyên bản, giới từ và collocation. So sánh các lựa chọn dễ nhầm với các từ liệt kê khác (hoàn thành đơn vs. hoàn thành phức).",
  6: "Ôn Part 6: đọc cả đoạn để hiểu chỉ mục dẫn vào chỗ trống — chèn câu thiếu hụt, chú ý vần/điệu và các cohesive device, thể bị động.",
  7: "Ôn Part 7: skim mục đích/ý chính của từng tài liệu, scan chi tiết cho các câu có từ khóa, đối chiếu nhiều tài liệu trong bộ đoạn.",
};

const DISCLAIMER = "Điểm quy đổi Reading (ước lượng) theo công thức số câu đúng × 4.95 — KHÔNG phải điểm ETS chính thức.";

interface PassageGroup {
  passage: ReadingPassage;
  title: string;
  questions: ReadingQuestion[];
}

export default function ReadingResultsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"wrong" | "all">("wrong");

  useEffect(() => setMounted(true), []);

  const attempt = mounted && id ? getAttempt(id) : undefined;
  const previous = mounted && id ? getPreviousAttempt(id) : undefined;
  const totalAttempts = mounted ? loadHistory().length : 0;

  const wrongCount = useMemo(
    () => (attempt ? READING_QUESTIONS.filter((q) => attempt.answers[q.id] !== q.answer).length : 0),
    [attempt]
  );

  const passageGroups = useMemo<PassageGroup[]>(
    () =>
      READING_PASSAGES
        .map((passage) => ({
          passage,
          title:
            passage.documents[0]?.title ??
            `Questions ${passage.questionIds[0]}–${passage.questionIds[passage.questionIds.length - 1]}`,
          questions: passage.questionIds
            .map((qid) => getReadingQuestionById(qid))
            .filter((q): q is ReadingQuestion => Boolean(q)),
        })),
    []
  );

  const visiblePart5 = useMemo(
    () => READING_QUESTIONS.filter((q) => q.part === 5 && (filter === "all" || attempt?.answers[q.id] !== q.answer)),
    [attempt, filter]
  );

  const visibleGroups = useMemo(
    () =>
      passageGroups
        .map((g) => ({
          ...g,
          questions: g.questions.filter((q) => filter === "all" || attempt?.answers[q.id] !== q.answer),
        }))
        .filter((g) => g.questions.length > 0),
    [passageGroups, attempt, filter]
  );

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-soft">Đang tải kết quả…</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Không tìm thấy kết quả</h1>
          <p className="max-w-md text-sm text-ink-soft">
            Attempt “{id ?? "(trống)"}” không có trong lịch sử của trình duyệt này. Có thể bạn đã xoá lịch sử ôn tập.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/reading/practice" className="inline-flex min-h-[44px] items-center rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark">Làm bài ngay</Link>
            <Link href="/reading" className="inline-flex min-h-[44px] items-center rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-paper-deep">Về trang Reading</Link>
          </div>
        </main>
      </div>
    );
  }

  const deltaScaled = previous ? attempt.scaled - previous.scaled : null;
  const deltaRaw = previous ? attempt.raw - previous.raw : null;
  const weakest = weakestPart(attempt.perPart);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 px-3 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="animate-fade-up text-xs font-bold uppercase tracking-[0.24em] text-brand">
            READING REVISION
          </p>
          <h1 className="animate-fade-up mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">
            Kết quả bài làm
          </h1>
          <p className="animate-fade-up mt-1 text-sm text-ink-soft">
            Nộp lúc {new Date(attempt.date).toLocaleString("vi-VN")} · Lần làm thứ {totalAttempts} được lưu trên trình duyệt này
          </p>

          {/* Điểm tổng quan */}
          <section className="animate-fade-up mt-5 grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center" style={{ animationDelay: "80ms" }}>
            <ScoreRing raw={attempt.raw} />
            <div>
              <p className="text-sm font-semibold text-ink-soft">Điểm quy đổi Reading (ước lượng)</p>
              <p className="mt-0.5 font-display text-5xl font-bold font-tabular text-brand-dark">
                {formatScaledScore(attempt.scaled)}
                <span className="text-lg font-semibold text-ink-soft"> / 495</span>
              </p>
              <p className="mt-1 max-w-md text-[11px] leading-4 text-ink-soft">{DISCLAIMER}</p>
              {deltaScaled !== null && deltaRaw !== null && (
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                    deltaScaled >= 0 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {deltaScaled >= 0
                      ? <path d="M12 19V5m0 0l-5 5m5-5l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      : <path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  {deltaScaled >= 0 ? "+" : ""}{formatScaledScore(deltaScaled)} điểm quy đổi ({deltaRaw >= 0 ? "+" : ""}{deltaRaw} câu đúng) so với lần trước
                </span>
              )}
            </div>
          </section>

          {/* Breakdown theo Part */}
          <section className="animate-fade-up mt-4 rounded-2xl border border-line bg-white p-5 shadow-card" style={{ animationDelay: "160ms" }}>
            <h2 className="font-display text-lg font-bold text-ink">Phân tích theo từng Part</h2>
            <div className="mt-3">
              <PartBreakdown items={attempt.perPart} meta={READING_BREAKDOWN_META} />
            </div>
            <div className="mt-4 rounded-xl border border-accent/50 bg-accent-soft/60 p-3 text-sm leading-6 text-ink">
              <strong className="text-accent-dark">Cần ôn nhất — {weakest.part}:</strong> {READING_ADVICE[weakest.part as 5 | 6 | 7]}
            </div>
          </section>

          {/* Danh sách câu */}
          <section className="mt-6" style={{ animationDelay: "240ms" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                Chi tiết từng câu {filter === "wrong" ? `(${wrongCount} câu sai)` : "(toàn bộ 100 câu)"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Lọc câu">
                  <button type="button" onClick={() => setFilter("wrong")} aria-pressed={filter === "wrong"} className={`rounded-md px-3 py-2 min-h-[40px] transition-all ${filter === "wrong" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                    Chỉ câu sai
                  </button>
                  <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-md px-3 py-2 min-h-[40px] transition-all ${filter === "all" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                    Tất cả
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {visiblePart5.length === 0 && !visibleGroups.length && (
                <p className="rounded-2xl border border-ok/40 bg-ok-soft p-6 text-center font-semibold text-ok">
                  Tuyệt vời — bạn không sai câu nào!
                </p>
              )}
              {visiblePart5.map((q) => <ResultQuestionCard key={q.id} q={q} answers={attempt.answers} />)}
              {visibleGroups.map((g) => (
                <PassageGroupCard key={g.passage.id} group={g} answers={attempt.answers} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-line pt-6 pb-10">
            <Link href="/reading/practice" onClick={() => clearDraft()} className="inline-flex min-h-[48px] items-center rounded-xl bg-cta px-6 py-3.5 text-sm font-extrabold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-cta-dark hover:shadow-lift active:scale-[0.98]">
              Làm lại
            </Link>
            <Link href="/reading/review" className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-brand bg-white px-6 py-3.5 text-sm font-bold text-brand-dark transition-all hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]">
              Ôn tập Reading
            </Link>
            <Link href="/" className="inline-flex min-h-[48px] items-center rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-deep">
              Trang chủ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultQuestionCard({ q, answers }: { q: ReadingQuestion; answers: Record<number, string> }) {
  const chosen = answers[q.id];
  const correct = q.answer;
  const isCorrect = chosen === correct;
  return (
    <article className={`rounded-2xl border p-4 shadow-card transition-shadow duration-200 hover:shadow-lift ${isCorrect ? "border-line bg-white" : "border-bad/40 bg-bad-soft/30"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white font-tabular">
          {q.id}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Part {q.part}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${isCorrect ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
          {isCorrect ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          {isCorrect ? "Đúng" : "Sai"}
        </span>
      </div>
      {q.prompt && <p className="mt-2 font-semibold leading-6 text-ink">{q.prompt}</p>}
      <ul className="mt-2 flex flex-col gap-1.5 text-sm">
        {q.options.map((opt) => {
          const isAnswer = opt.key === correct;
          const isChosen = opt.key === chosen;
          let cls = "border-line bg-white text-ink-soft";
          if (isAnswer) cls = "border-ok bg-ok-soft text-ok font-semibold";
          else if (isChosen) cls = "border-bad bg-bad-soft text-bad font-semibold";
          return (
            <li key={opt.key} className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 ${cls}`}>
              <span className="font-bold">{opt.key}.</span>
              <span>{opt.text}</span>
              {isAnswer && <span className="ml-auto shrink-0 text-[11px] font-bold uppercase">Đáp án</span>}
              {!isAnswer && isChosen && <span className="ml-auto shrink-0 text-[11px] font-bold uppercase">Bạn chọn</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">
        Đáp án của bạn: <strong className="text-ink">{chosen ?? "(bỏ trống)"}</strong> · Đáp án đúng: <strong className="text-ok">{correct}</strong>
      </p>
    </article>
  );
}

function PassageGroupCard({ group, answers }: { group: PassageGroup; answers: Record<number, string> }) {
  const [open, setOpen] = useState(false);
  const correctCount = group.passage.questionIds.filter(
    (id) => answers[id] === getReadingQuestionById(id)?.answer
  ).length;
  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-left min-h-[56px]"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
          className={`shrink-0 text-ink-soft transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-ink">{group.title}</span>
          <span className="block text-[11px] text-ink-soft">Questions {group.passage.questionIds[0]}–{group.passage.questionIds[group.passage.questionIds.length - 1]} · Đúng {correctCount}/{group.passage.questionIds.length}</span>
        </span>
        <span className="ml-auto shrink-0 text-xs font-semibold text-ink-soft">Xem đoạn văn</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="mt-2 flex flex-col gap-3 border-t border-line p-3">
            {group.passage.documents.map((doc) => (
              <ReadingDocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-line p-3">
        {group.questions.map((q) => (
          <ResultQuestionCard key={q.id} q={q} answers={answers} />
        ))}
      </div>
    </div>
  );
}
