"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PartBreakdown from "@/components/PartBreakdown";
import ScoreRing from "@/components/ScoreRing";
import SiteHeader from "@/components/SiteHeader";
import SpeakButton from "@/components/SpeakButton";
import Transcript from "@/components/Transcript";
import { PART_META, QUESTIONS, getGroupForQuestion, type ExamQuestion, type PartNumber, EXAM_DATE } from "@/data/exam";
import { formatScaledScore, PART_ADVICE, weakestPart } from "@/lib/scoring";
import { clearDraft, getAttempt, getPreviousAttempt, loadHistory } from "@/lib/storage";
import { speechTextForQuestion, type SpeechRate } from "@/lib/tts";

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"wrong" | "all">("wrong");
  const [rate, setRate] = useState<SpeechRate>(1);

  useEffect(() => setMounted(true), []);

  const attempt = mounted && id ? getAttempt(id) : undefined;
  const previous = mounted && id ? getPreviousAttempt(id) : undefined;
  const totalAttempts = mounted ? loadHistory().length : 0;

  const wrongCount = useMemo(
    () => (attempt ? QUESTIONS.filter((q) => attempt.answers[q.id] !== q.answer).length : 0),
    [attempt]
  );

  if (!mounted) {
    return (
      <div className="animate-page-enter flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-soft">Đang tải kết quả…</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="animate-page-enter flex min-h-screen flex-col bg-paper">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Không tìm thấy kết quả</h1>
          <p className="max-w-md text-sm text-ink-soft">
            Attempt “{id ?? "(trống)"}” không có trong lịch sử của trình duyệt này. Có thể bạn đã xoá lịch sử ôn tập.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/practice" className="inline-flex min-h-[44px] items-center rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark">Làm bài ngay</Link>
            <Link href="/" className="inline-flex min-h-[44px] items-center rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-paper-deep">Về trang chủ</Link>
          </div>
        </main>
      </div>
    );
  }

  const deltaScaled = previous ? attempt.scaled - previous.scaled : null;
  const deltaRaw = previous ? attempt.raw - previous.raw : null;
  const weakest = weakestPart(attempt.perPart);
  const weakestMeta = PART_META.find((m) => m.part === weakest.part)!;

  const visibleQuestions = QUESTIONS.filter(
    (q) => filter === "all" || attempt.answers[q.id] !== q.answer
  );

  function renderQuestion(q: ExamQuestion) {
    const chosen = attempt!.answers[q.id];
    const correct = q.answer;
    const isCorrect = chosen === correct;
    const group = getGroupForQuestion(q);
    return (
      <article
        key={q.id}
        className={`rounded-2xl border p-4 shadow-card transition-shadow duration-200 hover:shadow-lift ${
          isCorrect ? "border-line bg-white" : "border-bad/40 bg-bad-soft/30"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white font-tabular">
            {q.id}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Part {q.part}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isCorrect ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
            }`}
          >
            {isCorrect ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            )}
            {isCorrect ? "Đúng" : "Sai"}
          </span>
          <div className="ml-auto">
            <SpeakButton text={speechTextForQuestion(q, group)} rate={rate} label="Nghe" className="!py-1 text-xs" />
          </div>
        </div>

        {q.part === 1 && q.image && (
          <Image src={q.image} alt={q.imageAlt ?? `Bức tranh câu ${q.id}`} width={640} height={480} className="mt-3 h-auto w-full max-w-md rounded-xl border border-line object-contain" sizes="(max-width: 768px) 100vw, 480px" />
        )}
        {q.prompt && <p className="mt-2 font-semibold leading-6 text-ink">{q.prompt}</p>}
        {q.graphic && (
          <Image src={q.graphic} alt={q.graphicAlt ?? `Graphic câu ${q.id}`} width={640} height={400} className="mt-2 h-auto w-full max-w-md rounded-xl border border-accent/50 object-contain" sizes="(max-width: 768px) 100vw, 480px" />
        )}

        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {q.options.map((opt) => {
            const isAnswer = opt.key === correct;
            const isChosen = opt.key === chosen;
            let cls = "border-line bg-white text-ink-soft";
            if (isAnswer) cls = "border-ok bg-ok-soft text-ok font-semibold";
            else if (isChosen) cls = "border-bad bg-bad-soft text-bad font-semibold";
            return (
              <li key={opt.key} className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 ${cls}`}>
                <span className="shrink-0 font-bold">{opt.key}.</span>
                <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                {isAnswer && <span className="ml-auto shrink-0 text-[11px] font-bold uppercase">Đáp án</span>}
                {!isAnswer && isChosen && <span className="ml-auto shrink-0 text-[11px] font-bold uppercase">Bạn chọn</span>}
              </li>
            );
          })}
        </ul>

        <p className="mt-2 text-xs text-ink-soft">
          Đáp án của bạn: <strong className="text-ink">{chosen ?? "(bỏ trống)"}</strong> · Đáp án đúng:{" "}
          <strong className="text-ok">{correct}</strong>
        </p>

        {group && (
          <div className="mt-2">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Transcript — {group.title} ({group.category})
            </p>
            <Transcript transcript={group.transcript} />
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="animate-page-enter flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 px-3 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="animate-fade-up text-xs font-bold uppercase tracking-[0.24em] text-brand">
            LISTENING REVISION · {EXAM_DATE}
          </p>
          <h1 className="animate-fade-up mt-1 font-display text-3xl font-bold text-ink sm:text-4xl" style={{ animationDelay: "80ms" }}>
            Kết quả bài làm
          </h1>
          <p className="animate-fade-up mt-1 text-sm text-ink-soft" style={{ animationDelay: "140ms" }}>
            Nộp lúc {new Date(attempt.date).toLocaleString("vi-VN")} · Lần làm thứ {totalAttempts} được lưu trên trình duyệt này
          </p>

          {/* Điểm tổng quan */}
          <section className="animate-fade-up mt-5 grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center" style={{ animationDelay: "180ms" }}>
            <ScoreRing raw={attempt.raw} />
            <div>
              <p className="text-sm font-semibold text-ink-soft">Điểm quy đổi Listening (ước lượng)</p>
              <p className="mt-0.5 font-display text-5xl font-bold font-tabular text-brand-dark">
                {formatScaledScore(attempt.scaled)}
                <span className="text-lg font-semibold text-ink-soft"> / 495</span>
              </p>
              <p className="mt-1 max-w-md text-[11px] leading-4 text-ink-soft">
                ƯỚC LƯỢNG theo công thức tuyến tính số câu đúng × 4.95 — KHÔNG phải điểm ETS chính thức.
              </p>
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
          <section className="animate-fade-up mt-4 rounded-2xl border border-line bg-white p-5 shadow-card" style={{ animationDelay: "240ms" }}>
            <h2 className="font-display text-lg font-bold text-ink">Phân tích theo từng Part</h2>
            <div className="mt-3">
              <PartBreakdown items={attempt.perPart} />
            </div>
            <div className="mt-4 rounded-xl border border-accent/50 bg-accent-soft/60 p-3 text-sm leading-6 text-ink">
              <strong className="text-accent-dark">Cần ôn nhất — {weakestMeta.name}:</strong> {PART_ADVICE[weakest.part as PartNumber]}
            </div>
          </section>

          {/* Danh sách câu */}
          <section className="mt-6" style={{ animationDelay: "300ms" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                Chi tiết từng câu {filter === "wrong" ? `(${wrongCount} câu sai)` : "(toàn bộ 100 câu)"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Lọc câu">
                  <button type="button" onClick={() => setFilter("wrong")} aria-pressed={filter === "wrong"} className={`rounded-md px-3 py-2 min-h-[44px] transition-all ${filter === "wrong" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                    Chỉ câu sai
                  </button>
                  <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-md px-3 py-2 min-h-[44px] transition-all ${filter === "all" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                    Tất cả
                  </button>
                </div>
                <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" aria-label="Tốc độ đọc">
                  {([0.8, 1] as SpeechRate[]).map((r) => (
                    <button key={r} type="button" onClick={() => setRate(r)} aria-pressed={rate === r} className={`rounded-md px-2.5 py-2 min-h-[44px] min-w-[44px] transition-all ${rate === r ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"}`}>
                      {r === 0.8 ? "0.8x" : "1.0x"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {visibleQuestions.length === 0 && (
                <p className="rounded-2xl border border-ok/40 bg-ok-soft p-6 text-center font-semibold text-ok">
                  Tuyệt vời — bạn không sai câu nào!
                </p>
              )}
              {visibleQuestions.map(renderQuestion)}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-line pt-6 pb-10">
            <Link
              href="/practice"
              onClick={() => clearDraft()}
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[#d97706] px-6 py-3.5 text-sm font-extrabold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-lift active:scale-[0.98]"
            >
              Làm lại
            </Link>
            <Link
              href="/review"
              className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-brand bg-white px-6 py-3.5 text-sm font-bold text-brand-dark transition-all hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]"
            >
              Ôn tập toàn bộ
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-deep"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
