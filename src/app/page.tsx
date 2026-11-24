"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import SiteHeader from "@/components/SiteHeader";
import { TOTAL_QUESTIONS, getQuestionById } from "@/data/exam";
import { formatScaledScore } from "@/lib/scoring";
import { READING_TOTAL_QUESTIONS, getReadingQuestionById } from "@/data/reading";
import { clearDraft, clearHistoryAndMastered, computeStats, loadHistory, loadMastered } from "@/lib/storage";
import {
  clearHistoryAndMastered as clearReadingHistoryAndMastered,
  computeStats as computeReadingStats,
  loadHistory as loadReadingHistory,
  loadMastered as loadReadingMastered,
} from "@/lib/reading-storage";

const TRUST_CHIPS = [
  `${TOTAL_QUESTIONS} câu Listening`,
  "~45 phút",
  `${READING_TOTAL_QUESTIONS} câu Reading`,
  "~75 phút",
  "Làm lại nhiều lần",
];

type Module = "listening" | "reading";

function HeadphonesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-brand-dark">
      <path d="M12 5v2m0 6v7m7-9h2.5a4 4 0 1 1-8 0H5a4 4 0 1 1 8 0h2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-brand-dark">
      <path d="M5 3.5h14a4 4 0 0 1 4 4v11M19 19.5l-4-1.5v-3l4 1.5v-3zM9 19.5l-4-1.5v-3l4 1.5v-3zM19 16.5V9a4 4 0 0 0-4-4h-6a4 4 0 0 0-4 4v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [module, setModule] = useState<Module>("listening");
  const [stats, setStats] = useState(() => computeStats([]));
  const [hasHistory, setHasHistory] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function loadModule(m: Module) {
    if (m === "listening") {
      const history = loadHistory();
      setStats(computeStats(history));
      setHasHistory(history.length > 0 || Object.keys(loadMastered()).length > 0);
    } else {
      const history = loadReadingHistory();
      setStats(computeReadingStats(history));
      setHasHistory(history.length > 0 || Object.keys(loadReadingMastered()).length > 0);
    }
  }

  function reload() {
    loadModule(module);
    setMounted(true);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadModule(module);
  }, [module]);

  const getQ = (id: number) =>
    module === "listening" ? getQuestionById(id) : getReadingQuestionById(id);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-soft/40 to-paper px-4 py-12 sm:py-16">
          {/* Nền trang trí: chấm mờ + blob teal/gold */}
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Cột trái */}
            <div className="animate-fade-up">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                TOEIC · LISTENING &amp; READING
              </p>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                TOEIC REVISION<span className="text-brand">.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
                Luyện trọn bộ 200 câu Listening + Reading — làm lại nhiều lần, theo dõi tiến bộ.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/practice"
                  onClick={() => clearDraft()}
                  className="inline-flex min-h-[52px] items-center rounded-xl bg-[#d97706] px-7 py-4 text-base font-extrabold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-lift active:scale-[0.98]"
                >
                  Làm Listening <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/reading"
                  className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-dark px-7 py-4 text-base font-extrabold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:shadow-lift active:scale-[0.98]"
                >
                  Làm Reading
                </Link>
                <Link
                  href="/review"
                  className="inline-flex min-h-[52px] items-center rounded-xl border-2 border-brand bg-white px-7 py-4 text-base font-extrabold text-brand-dark transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]"
                >
                  Ôn tập Listening
                </Link>
                <Link
                  href="/reading/review"
                  className="inline-flex min-h-[52px] items-center rounded-xl border-2 border-brand bg-white px-7 py-4 text-base font-extrabold text-brand-dark transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]"
                >
                  Ôn tập Reading
                </Link>
                <Link
                  href="/explanations"
                  className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-accent bg-accent-soft px-5 py-3 text-sm font-extrabold text-accent-dark transition-all hover:-translate-y-0.5 hover:bg-accent/20"
                >
                  Giải thích 200 câu →
                </Link>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Thông tin đề thi">
                {TRUST_CHIPS.map((chip, i) => (
                  <li
                    key={chip}
                    className="animate-fade-up rounded-full border border-line bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-sm"
                    style={{ animationDelay: `${240 + i * 80}ms` }}
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột phải — bìa đề thi */}
            <div className="animate-fade-up flex justify-center lg:justify-end" style={{ animationDelay: "120ms" }}>
              <div className="w-full max-w-sm rounded-2xl border border-line bg-gradient-to-br from-paper-deep to-surface p-6 shadow-card">
                <div className="flex min-h-[340px] flex-col rounded-xl border border-line/70 bg-white/60 px-6 py-7 text-center">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-accent-dark">
                    OFFICIAL PRACTICE EXAM
                  </p>
                  <div className="mx-auto mt-6 h-px w-16 bg-accent/70" aria-hidden="true" />
                  <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-ink">
                    TOEIC REVISION
                  </h2>
                  <p className="mt-3 font-display text-lg font-semibold text-brand-dark">28.11.2026</p>
                  <div className="mt-auto flex flex-col gap-2 pt-8">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink-soft font-tabular">
                      LISTENING · 45 MINUTES
                    </p>
                    <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-brand-dark font-tabular">
                      READING · 75 MINUTES
                    </p>
                    <div className="mx-auto mt-2 h-px w-12 bg-line" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold tracking-wide text-ink">TOEIC LISTENING / READING</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-display text-[11px] font-bold text-white">
                    TR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chọn bài luyện — 2 card lớn */}
        <section className="animate-fade-up mx-auto max-w-6xl px-4 py-10">
          <h2 className="py-2 text-sm font-extrabold uppercase tracking-[0.24em] text-brand">Chọn bài luyện</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Listening */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lift">
              <div className="flex items-center gap-2.5">
                <HeadphonesIcon />
                <h3 className="font-display text-lg font-bold text-ink">Listening</h3>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
                <li>{TOTAL_QUESTIONS} câu · ~45 phút · Part I–IV</li>
                <li>Nghe lời thoại, nhận câu hỏi, chọn đáp án</li>
                <li>Transcript & đáp án cho mọi câu</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/practice"
                  onClick={() => clearDraft()}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-cta px-6 py-3.5 text-sm font-extrabold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-cta-dark active:scale-[0.98]"
                >
                  Làm Listening
                </Link>
                <Link
                  href="/review"
                  className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-brand bg-white px-6 py-3.5 text-sm font-bold text-brand-dark transition-all hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]"
                >
                  Ôn tập &amp; đáp án
                </Link>
              </div>
            </div>

            {/* Reading */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lift">
              <div className="flex items-center gap-2.5">
                <BookIcon />
                <h3 className="font-display text-lg font-bold text-ink">Reading</h3>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
                <li>{READING_TOTAL_QUESTIONS} câu · ~75 phút · Part 5–7</li>
                <li>Điền từ/cụm từ, hoàn thành đoạn văn, đọc hiểu</li>
                <li>19 bộ đoạn đọc: email, article, notice, chat, table, …</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/reading"
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-cta px-6 py-3.5 text-sm font-extrabold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-cta-dark active:scale-[0.98]"
                >
                  Làm Reading
                </Link>
                <Link
                  href="/reading/review"
                  className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-brand bg-white px-6 py-3.5 text-sm font-bold text-brand-dark transition-all hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98]"
                >
                  Ôn tập &amp; đáp án
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 lg:grid-cols-5">
          {/* Thống kể cá nhân — segmented Listening | Reading */}
          <section
            className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card lg:col-span-2"
            aria-label="Thống kể cá nhân"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">Thống kể của bạn</h2>
              <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Chọn module">
                {(["listening", "reading"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModule(m)}
                    aria-pressed={module === m}
                    className={`min-h-[36px] rounded-md px-3 py-1.5 transition-all ${
                      module === m ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"
                    }`}
                  >
                    {m === "listening" ? "Listening" : "Reading"}
                  </button>
                ))}
              </div>
              {mounted && hasHistory && (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="text-xs font-semibold text-bad underline decoration-dotted underline-offset-2 hover:text-red-800 min-h-[36px]"
                >
                  Xoá lịch sử {module === "listening" ? "Listening" : "Reading"}
                </button>
              )}
            </div>
            {!mounted ? (
              <div className="mt-4 flex flex-col gap-2" aria-label="Đang tải thống kê">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-shimmer h-12 rounded-xl"
                    style={{
                      backgroundImage: "linear-gradient(90deg, var(--color-paper-deep) 20%, var(--color-brand-soft) 50%, var(--color-paper-deep) 80%)",
                      backgroundSize: "200% 100%",
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>
            ) : stats.attempts === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-paper p-5 text-sm leading-6 text-ink-soft">
                Chưa có lần làm nào. Bấm <strong className="text-ink">Bắt đầu làm bài</strong> — kết quả sẽ được lưu trên trình duyệt này để theo dõi tiến bộ.
              </div>
            ) : (
              <>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-paper p-3 ring-1 ring-line/60">
                    <dt className="text-[11px] font-semibold uppercase text-ink-soft">Số lần làm</dt>
                    <dd className="mt-1 font-display text-2xl font-bold font-tabular text-ink">{stats.attempts}</dd>
                  </div>
                  <div className="rounded-xl bg-brand-soft p-3 ring-1 ring-brand/20">
                    <dt className="text-[11px] font-semibold uppercase text-ink-soft">Best (ước lượng)</dt>
                    <dd className="mt-1 font-display text-2xl font-bold font-tabular text-brand-dark">{stats.bestScaled === null ? "—" : formatScaledScore(stats.bestScaled)}</dd>
                  </div>
                  <div className="rounded-xl bg-paper p-3 ring-1 ring-line/60">
                    <dt className="text-[11px] font-semibold uppercase text-ink-soft">Trung bình</dt>
                    <dd className="mt-1 font-display text-2xl font-bold font-tabular text-ink">{stats.avgScaled === null ? "—" : formatScaledScore(stats.avgScaled)}</dd>
                  </div>
                </dl>
                {stats.mostMissed.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Câu sai nhiều nhất</h3>
                    <ol className="mt-2 flex flex-col gap-1.5">
                      {stats.mostMissed.map(({ id, wrong }) => {
                        const q = getQ(id);
                        return (
                          <li key={id} className="flex items-center gap-2 rounded-lg bg-bad-soft/50 px-3 py-2 text-sm">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bad text-[11px] font-extrabold text-white font-tabular">
                              {id}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-ink">
                              {q ? `Part ${q.part} · đáp án đúng ${q.answer}` : ""}
                            </span>
                            <span className="shrink-0 text-xs font-bold text-bad">sai {wrong} lần</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </>
            )}
            <p className="mt-4 text-[11px] leading-4 text-ink-soft">
              Dữ liệu chỉ lưu cục bộ trên trình duyệt bạn đang dùng (localStorage). Điểm quy đổi là ước lượng, không phải điểm ETS chính thức.
            </p>
          </section>

          {/* Ví dụ minh hoạ PART I */}
          <section
            className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card lg:col-span-3"
            aria-label="Ví dụ minh hoạ Part I"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="font-display text-lg font-bold text-ink">Ví dụ minh hoạ — PART I</h2>
            <p className="mt-1 text-xs text-ink-soft">Nhìn ảnh, nghe 4 mệnh đề và chọn mệnh đề mô tả đúng nhất (câu ví dụ không tính điểm).</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-line bg-paper">
                <Image
                  src="/exam/example.png"
                  alt="Ảnh ví dụ trong booklet TOEIC REVISION: hai người đang chụp ảnh"
                  width={1200}
                  height={900}
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 640px) 100vw, 520px"
                  priority
                />
              </div>
              <div className="text-sm leading-6">
                <p className="font-semibold text-ink">Example:</p>
                <p className="mt-2 rounded-lg border border-ok/40 bg-ok-soft px-3 py-2 text-sm font-bold text-ok">
                  (D) “They’re taking photographs.”
                </p>
                <p className="mt-3 text-xs leading-5 text-ink-soft">
                  Mệnh đề (A)–(C) không được in trên đề; statement (D) là đáp án đúng — mô tả đúng bức ảnh minh hoạ.
                </p>
              </div>
            </div>
          </section>
        </div>

      </main>

      <footer className="border-t border-line bg-paper px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-center text-[11px] text-ink-soft">
          <span className="grid h-6 w-6 place-items-center rounded bg-brand font-display text-[10px] font-bold text-white" aria-hidden="true">
            TR
          </span>
          <span>TOEIC REVISION · 28/11/2026 — Tài liệu ôn tập nội bộ. Điểm quy đổi Listening (5–495) và Reading (5–495) là ước lượng, không phải điểm ETS chính thức.</span>
        </div>
      </footer>

      <ConfirmDialog
        open={deleteOpen}
        title={`Xoá lịch sử ${module === "listening" ? "Listening" : "Reading"}?`}
        message={
          <>
            Toàn bộ <strong className="text-ink">lịch sử làm bài {module === "listening" ? "Listening" : "Reading"} (tối đa 50 lần)</strong> và{" "}
            <strong className="text-ink">trạng thái “đã nắm”</strong>{module === "reading" ? " của 100 câu Reading" : ""} sẽ bị xoá vĩnh viễn khỏi trình duyệt này.
            Draft đang làm dở (nếu có) vẫn được giữ. Không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá hết"
        danger
        onConfirm={() => {
          if (module === "listening") {
            clearHistoryAndMastered();
          } else {
            clearReadingHistoryAndMastered();
          }
          setDeleteOpen(false);
          reload();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
