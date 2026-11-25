"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReadingDocumentCard from "@/components/ReadingDocumentCard";
import SiteHeader from "@/components/SiteHeader";
import {
  READING_PART_META,
  READING_PASSAGES,
  READING_QUESTIONS,
  READING_TOTAL_QUESTIONS,
  getReadingQuestionById,
  readingPassagePlainText,
  type ReadingPassage,
  type ReadingQuestion,
} from "@/data/reading";
import {
  clearHistoryAndMastered,
  loadHistory,
  loadMastered,
  toggleMastered,
  wrongCountByQuestion,
} from "@/lib/reading-storage";

function questionHaystack(q: ReadingQuestion): string {
  const passage = q.passageId ? READING_PASSAGES.find((p) => p.id === q.passageId) : null;
  return [
    String(q.id),
    `Part ${q.part}`,
    q.prompt,
    ...q.options.map((o) => o.text),
    passage ? `${passage.questionIds.join(" ")} ${readingPassagePlainText(passage)}` : "",
  ]
    .join(" ")
    .toLowerCase();
}

export default function ReadingReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [mastered, setMastered] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<"all" | "unmastered">("all");
  const [search, setSearch] = useState("");
  const [openPassages, setOpenPassages] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    for (const p of READING_PASSAGES) map[p.id] = true;
    return map;
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [wrongTable, setWrongTable] = useState<{ id: number; wrong: number }[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    setMastered(loadMastered());
    const history = loadHistory();
    setAttemptCount(history.length);
    setWrongTable(
      [...wrongCountByQuestion(history).entries()]
        .map(([id, wrong]) => ({ id, wrong }))
        .sort((a, b) => b.wrong - a.wrong || a.id - b.id)
        .slice(0, 10)
    );
    setMounted(true);
  }, []);

  const needle = search.trim().toLowerCase();

  const visible = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const q of READING_QUESTIONS) {
      const okFilter = filter === "all" || !mastered[q.id];
      const okSearch = needle === "" || questionHaystack(q).includes(needle);
      map.set(q.id, okFilter && okSearch);
    }
    return map;
  }, [filter, mastered, needle]);

  function toggleMasteredClick(id: number) {
    // Viết storage trước, rồi đặt state — StrictMode double-invoke updater sẽ nhân đôi bản ghi.
    setMastered(toggleMastered(id));
  }

  const masteredCount = READING_QUESTIONS.filter((q) => mastered[q.id]).length;

  function renderQuestionCard(q: ReadingQuestion) {
    if (!visible.get(q.id)) return null;
    const isMastered = Boolean(mastered[q.id]);
    return (
      <div
        key={q.id}
        id={`rq-${q.id}`}
        className="scroll-mt-[calc(var(--site-header-height)+8.5rem)] rounded-xl border border-line bg-white p-3 shadow-card transition-shadow duration-200 hover:shadow-lift sm:scroll-mt-[calc(var(--site-header-height)+4.5rem)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white font-tabular">
            {q.id}
          </span>
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
            Đáp án: {q.answer}
          </span>
          {isMastered && (
            <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">Đã nắm</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleMasteredClick(q.id)}
              aria-pressed={isMastered}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                isMastered
                  ? "border-ok bg-ok-soft text-ok"
                  : "border-line bg-white text-ink-soft hover:border-ok hover:text-ok"
              }`}
            >
              {isMastered ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
              )}
              {isMastered ? "Đã nắm" : "Chưa nắm"}
            </button>
          </div>
        </div>
        {q.prompt && <p className="mt-2 text-sm font-semibold leading-6 text-ink">{q.prompt}</p>}
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {q.options.map((opt) => (
            <li
              key={opt.key}
              className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 ${
                opt.key === q.answer ? "border-ok bg-ok-soft font-semibold text-ok" : "border-line bg-white text-ink-soft"
              }`}
            >
              <span className="shrink-0 font-bold">{opt.key}.</span>
              <span className="min-w-0 break-words">{opt.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderPassageGroup({ passage, label, defaultOpen }: { passage: ReadingPassage; label: string; defaultOpen: boolean }) {
    const anyVisible = passage.questionIds.some((id) => visible.get(id));
    if (!anyVisible) return null;
    const isOpen = openPassages[passage.id] ?? true;
    return (
      <div key={passage.id} className="rounded-2xl border border-line bg-paper-deep/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenPassages((prev) => ({ ...prev, [passage.id]: !isOpen }))}
            aria-expanded={isOpen}
            className="flex min-w-0 flex-1 items-center gap-2 text-left min-h-[44px]"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              className={`shrink-0 text-ink-soft transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-ink">
                {label} <span className="font-semibold text-ink-soft">· {passage.documents[0]?.kind}</span>
              </span>
              <span className="block text-[11px] text-ink-soft">
                Câu {passage.questionIds[0]}–{passage.questionIds[passage.questionIds.length - 1]} · Đã nắm{" "}
                {passage.questionIds.filter((id) => mastered[id]).length}/{passage.questionIds.length}
              </span>
            </span>
          </button>
        </div>
        <div inert={!isOpen} className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-col gap-2">
              {passage.documents.map((doc) => (
                <ReadingDocumentCard key={doc.id} doc={doc} />
              ))}
              {passage.questionIds.map((id) => renderQuestionCard(getReadingQuestionById(id)!))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPart5Section() {
    return (
      <section className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-left min-h-[56px] bg-paper-deep/30">
          <span className="text-sm font-extrabold text-ink">Part 5 · Điền từ/cụm từ</span>
          <span className="text-[11px] text-ink-soft">Câu {READING_PART_META[0].range}</span>
        </div>
        <div className="flex flex-col gap-3 p-3">
          {READING_QUESTIONS.filter((q) => q.part === 5).map((q) => renderQuestionCard(q))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 px-3 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">READING REVISION · 28/11/2026</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-bad/50 bg-white px-3 py-2 text-xs font-bold text-bad hover:bg-bad-soft min-h-[44px]"
              >
                Xoá lịch sử Reading
              </button>
            </div>
          </div>
          <h1 className="animate-fade-up mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Ôn tập &amp; đáp án</h1>
          <p className="animate-fade-up mt-1 text-sm text-ink-soft" style={{ animationDelay: "80ms" }}>
            Toàn bộ 100 câu kèm đáp án đúng. Đã nắm{" "}
            <strong className="font-tabular text-ink">{mounted ? masteredCount : 0}/{READING_TOTAL_QUESTIONS}</strong> câu.
          </p>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Các trang học thuộc đáp án Reading">
            <Link href="/reading/answer-check" className="inline-flex min-h-[44px] items-center rounded-xl border border-brand bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand/20">
              Học thuộc đáp án Part 5
            </Link>
            <Link href="/reading/answer-check/part-6" className="inline-flex min-h-[44px] items-center rounded-xl border border-brand bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand/20">
              Học thuộc đáp án Part 6
            </Link>
            <Link href="/reading/answer-check/part-7" className="inline-flex min-h-[44px] items-center rounded-xl border border-brand bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand/20">
              Học thuộc đáp án Part 7
            </Link>
          </div>

          {/* Thanh công cụ: filter + search */}
          <div className="sticky top-[var(--site-header-height)] z-30 -mx-3 mt-4 border-b border-line/70 bg-paper/90 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Lọc câu">
                <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-md px-3 py-2 min-h-[44px] transition-all ${filter === "all" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                  Tất cả
                </button>
                <button type="button" onClick={() => setFilter("unmastered")} aria-pressed={filter === "unmastered"} className={`rounded-md px-3 py-2 min-h-[44px] transition-all ${filter === "unmastered" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                  Chưa nắm
                </button>
              </div>
              <label className="relative w-full min-w-0 flex-none sm:w-auto sm:flex-1">
                <span className="sr-only">Tìm trong số câu, đáp án, đoạn văn, tiêu đề tài liệu</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo nội dung, số câu, đáp án…"
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-base text-ink placeholder:text-ink-soft min-h-[44px] sm:text-sm"
                />
              </label>
            </div>
          </div>

          {/* Bảng câu hay sai từ lịch sử */}
          <section className="animate-fade-up mt-5 rounded-2xl border border-line bg-white p-5 shadow-card" aria-label="Câu hay sai từ lịch sử làm bài" style={{ animationDelay: "120ms" }}>
            <h2 className="font-display text-lg font-bold text-ink">Câu hay sai từ lịch sử</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {attemptCount > 0
                ? `Tổng hợp từ ${attemptCount} lần làm bài đã lưu trên trình duyệt này (top 10). Bấm vào số câu để nhảy tới câu đó.`
                : "Chưa có dữ liệu lịch sử — làm bài ít nhất một lần để thống kê câu hay sai."}
            </p>
            {wrongTable.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-ink-soft">
                      <th className="py-1.5 pr-2">Câu</th>
                      <th className="py-1.5 pr-2">Part</th>
                      <th className="py-1.5 pr-2">Đáp án</th>
                      <th className="py-1.5">Số lần sai / {attemptCount} lần làm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wrongTable.map(({ id, wrong }) => {
                      const q = READING_QUESTIONS.find((item) => item.id === id)!;
                      return (
                        <tr key={id} className="border-t border-line">
                          <td className="py-1.5 pr-2">
                            <a href={`#rq-${id}`} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-extrabold text-brand-dark underline decoration-dotted underline-offset-2 font-tabular">
                              {id}
                            </a>
                          </td>
                          <td className="py-1.5 pr-2 text-ink-soft">{q.part}</td>
                          <td className="py-1.5 pr-2 font-bold text-ok">{q.answer}</td>
                          <td className="py-1.5 font-semibold text-bad font-tabular">{wrong} lần</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Accordion theo Part */}
          <div className="mt-5 flex flex-col gap-4 pb-12">
            {renderPart5Section()}
            {READING_PASSAGES.filter((p) => p.part === 6).map((p) => renderPassageGroup({ passage: p, label: `Questions ${p.questionIds[0]}–${p.questionIds[3]} · ${p.documents[0].kind}`, defaultOpen: true }))}
            {READING_PASSAGES.filter((p) => p.part === 7).map((p) => renderPassageGroup({ passage: p, label: `Questions ${p.questionIds[0]}–${p.questionIds[p.questionIds.length - 1]} · ${p.documents[0].title ?? ""}`, defaultOpen: true }))}
            {READING_QUESTIONS.every((q) => !visible.get(q.id)) && (
              <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink-soft">
                Không có câu nào khớp bộ lọc/từ khoá hiện tại.
              </p>
            )}
          </div>
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
          setMastered({});
          setWrongTable([]);
          setAttemptCount(0);
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
