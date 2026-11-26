"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import SiteHeader from "@/components/SiteHeader";
import { READING_PART_META, getReadingQuestionsByPart } from "@/data/reading";
import { formatScaledScore } from "@/lib/scoring";
import { clearDraft, clearHistoryAndMastered, computeStats, loadHistory, loadMastered } from "@/lib/reading-storage";

const PART_INFO = [
  {
    id: 5,
    label: READING_PART_META[0].nameVi,
    desc: `${READING_PART_META[0].count} câu · Điền từ/cụm từ vào câu văn`,
  },
  {
    id: 6,
    label: READING_PART_META[1].nameVi,
    desc: `${READING_PART_META[1].count} câu · Hoàn thành đoạn văn (chỗ trống inline)`,
  },
  {
    id: 7,
    label: READING_PART_META[2].nameVi,
    desc: `${READING_PART_META[2].count} câu · Đọc hiểu (single/double/triple)`,
  },
];

export default function ReadingHubPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(() => computeStats([]));
  const [hasHistory, setHasHistory] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function reload() {
    const history = loadHistory();
    setStats(computeStats(history));
    setHasHistory(history.length > 0 || Object.keys(loadMastered()).length > 0);
  }

  useEffect(() => {
    reload();
    setMounted(true);
  }, []);

  return (
    <div className="animate-page-enter flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                TOEIC · READING PRACTICE
              </p>
              <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                READING REVISION<span className="text-brand">.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
                100 câu đề thi Part 5–7 trong 75 phút — Điền từ, hoàn thành đoạn văn, đọc hiểu. Làm lại nhiều lần, theo dõi tiến bộ.
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/reading/practice"
                onClick={() => clearDraft()}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#d97706] px-7 py-4 text-base font-extrabold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b45309] hover:shadow-lift active:scale-[0.98] sm:w-auto"
              >
                Bắt đầu làm bài <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/reading/review"
                className="inline-flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-xl border-2 border-brand bg-white px-7 py-4 text-base font-extrabold text-brand-dark transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-soft hover:shadow-card active:scale-[0.98] sm:w-auto"
              >
                Ôn tập &amp; đáp án
              </Link>
            </div>
          </div>

          <section className="mt-8" aria-label="Học thuộc đáp án Reading theo Part">
            <h2 className="font-display text-lg font-bold text-ink">Học thuộc đáp án theo Part</h2>
            <p className="mt-1 text-sm text-ink-soft">Chọn một phần để luyện nhớ đáp án riêng, không ảnh hưởng lịch sử làm bài Reading.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link href="/reading/answer-check" className="rounded-2xl border border-brand/30 bg-brand-soft p-4 transition-colors hover:border-brand hover:bg-brand/20">
                <span className="block text-xs font-bold uppercase tracking-wide text-brand-dark">Part 5</span>
                <span className="mt-1 block font-display text-base font-bold text-ink">Điền từ/cụm từ</span>
                <span className="mt-1 block text-xs text-ink-soft">30 câu · Câu 1–30</span>
              </Link>
              <Link href="/reading/answer-check/part-6" className="rounded-2xl border border-brand/30 bg-brand-soft p-4 transition-colors hover:border-brand hover:bg-brand/20">
                <span className="block text-xs font-bold uppercase tracking-wide text-brand-dark">Part 6</span>
                <span className="mt-1 block font-display text-base font-bold text-ink">Hoàn thành đoạn văn</span>
                <span className="mt-1 block text-xs text-ink-soft">16 câu · Câu 31–46</span>
              </Link>
              <Link href="/reading/answer-check/part-7" className="rounded-2xl border border-brand/30 bg-brand-soft p-4 transition-colors hover:border-brand hover:bg-brand/20">
                <span className="block text-xs font-bold uppercase tracking-wide text-brand-dark">Part 7</span>
                <span className="mt-1 block font-display text-base font-bold text-ink">Đọc hiểu</span>
                <span className="mt-1 block text-xs text-ink-soft">54 câu · Câu 47–100</span>
              </Link>
            </div>
          </section>

          {/* Thẻ cấu trúc 3 Part */}
          <section className="mt-10" aria-label="Cấu trúc đề — 3 Part">
            <h2 className="font-display text-lg font-bold text-ink">Thẻ cấu trúc — 3 Part</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {PART_INFO.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-lift"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  <span className="inline-flex h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-dark text-base font-display font-bold">
                    {`P${p.id}`}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-ink">{p.label}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{p.desc}</p>
                  <p className="mt-2 text-[11px] font-tabular text-brand-dark">
                    {getReadingQuestionsByPart(p.id as 5 | 6 | 7).length} câu
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Thống kể */}
          <section
            className="mt-8 animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card"
            aria-label="Thống kể Reading của bạn"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">Thống kể Reading của bạn</h2>
              {mounted && hasHistory && (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="text-xs font-semibold text-bad underline decoration-dotted underline-offset-2 hover:text-red-800 min-h-[44px]"
                >
                  Xoá lịch sử Reading
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
              <p className="mt-4 text-sm text-ink-soft">
                Chưa có lần làm Reading nào. Bấm{" "}
                <strong className="text-ink">Bắt đầu làm bài</strong> để bắt đầu.
              </p>
            ) : (
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
            )}
            <p className="mt-3 text-[11px] leading-4 text-ink-soft">
              Điểm quy đổi Reading (5–495) là ước lượng, không phải điểm ETS chính thức.
            </p>
          </section>

          {/* Mục cần ôn nhất */}
          <p className="mt-8 animate-fade-up text-[11px] leading-4 text-ink-soft">
            Đề này tách riêng khỏi Listening: key lưu bài là <code className="rounded bg-paper-deep px-1">cdr.reading.*</code>.
          </p>
        </div>
      </main>

      <ConfirmDialog
        open={deleteOpen}
        title="Xoá lịch sử Reading?"
        message={
          <>
            Toàn bộ <strong className="text-ink">lịch sử làm bài Reading (tối đa 50 lần)</strong> và{" "}
            <strong className="text-ink">trạng thái “đã nắm” của 100 câu Reading</strong> sẽ bị xoá vĩnh viễn khỏi trình duyệt này.
            Draft đang làm dở (nếu có) vẫn được giữ. Không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá hết"
        danger
        onConfirm={() => {
          clearHistoryAndMastered();
          setDeleteOpen(false);
          reload();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
