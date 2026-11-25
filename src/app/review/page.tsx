"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import SiteHeader from "@/components/SiteHeader";
import SpeakButton from "@/components/SpeakButton";
import Transcript from "@/components/Transcript";
import {
  GROUPS,
  PART_META,
  QUESTIONS,
  TOTAL_QUESTIONS,
  getGroupForQuestion,
  type ExamGroup,
  type ExamQuestion,
  type PartNumber,
} from "@/data/exam";
import {
  clearHistoryAndMastered,
  loadHistory,
  loadMastered,
  saveMastered,
  wrongCountByQuestion,
} from "@/lib/storage";
import { speechTextForGroup, speechTextForQuestion, type SpeechRate } from "@/lib/tts";

const GOLD_LISTEN_CLASS =
  "!min-h-[36px] !border !border-accent/60 !bg-white !py-1 !text-xs !font-bold !text-accent-dark hover:!bg-accent-soft";

function questionHaystack(q: ExamQuestion): string {
  const group = getGroupForQuestion(q);
  return [
    String(q.id),
    q.prompt,
    ...q.options.map((o) => o.text),
    group ? `${group.title} ${group.category} ${group.transcript}` : "",
  ]
    .join(" ")
    .toLowerCase();
}

export default function ReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [mastered, setMastered] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<"all" | "unmastered">("all");
  const [search, setSearch] = useState("");
  const [openParts, setOpenParts] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const g of GROUPS) map[g.id] = true;
    return map;
  });
  const [rate, setRate] = useState<SpeechRate>(1);
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
    for (const q of QUESTIONS) {
      const okFilter = filter === "all" || !mastered[q.id];
      const okSearch = needle === "" || questionHaystack(q).includes(needle);
      map.set(q.id, okFilter && okSearch);
    }
    return map;
  }, [filter, mastered, needle]);

  function toggleMastered(id: number) {
    setMastered((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      saveMastered(next);
      return next;
    });
  }

  const masteredCount = QUESTIONS.filter((q) => mastered[q.id]).length;

  function renderQuestionCard(q: ExamQuestion) {
    if (!visible.get(q.id)) return null;
    const isMastered = Boolean(mastered[q.id]);
    return (
      <div
        key={q.id}
        id={`rq-${q.id}`}
        className="scroll-mt-32 rounded-xl border border-line bg-white p-3 shadow-card transition-shadow duration-200 hover:shadow-lift"
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
            {(q.part === 1 || q.part === 2) && (
              <SpeakButton text={speechTextForQuestion(q)} rate={rate} label="Nghe" className={GOLD_LISTEN_CLASS} />
            )}
            <button
              type="button"
              onClick={() => toggleMastered(q.id)}
              aria-pressed={isMastered}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
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

        {q.part === 1 && q.image && (
          <Image
            src={q.image}
            alt={q.imageAlt ?? `Bức tranh câu ${q.id}`}
            width={520}
            height={390}
            className="mt-2 h-auto w-full max-w-sm rounded-lg border border-line object-contain"
            sizes="(max-width: 768px) 100vw, 384px"
          />
        )}
        {q.prompt && <p className="mt-2 text-sm font-semibold leading-6 text-ink">{q.prompt}</p>}
        {q.graphic && (
          <Image
            src={q.graphic}
            alt={q.graphicAlt ?? `Graphic câu ${q.id}`}
            width={520}
            height={340}
            className="mt-2 h-auto w-full max-w-sm rounded-lg border border-accent/50 object-contain"
            sizes="(max-width: 768px) 100vw, 384px"
          />
        )}

        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {q.options.map((opt) => {
            const isAnswer = opt.key === q.answer;
            return (
              <li
                key={opt.key}
                className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 ${
                  isAnswer ? "border-ok bg-ok-soft font-semibold text-ok" : "border-line bg-white text-ink-soft"
                }`}
              >
                <span className="font-bold">{opt.key}.</span>
                <span>{opt.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderGroup(group: ExamGroup) {
    const groupQuestions = group.questionIds.map((id) => QUESTIONS.find((q) => q.id === id)!);
    const anyVisible = groupQuestions.some((q) => visible.get(q.id));
    if (!anyVisible) return null;
    const isOpen = openGroups[group.id] ?? true;
    const groupMastered = groupQuestions.filter((q) => mastered[q.id]).length;
    return (
      <div key={group.id} className="rounded-2xl border border-line bg-paper-deep/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !isOpen }))}
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
                {group.title} <span className="font-semibold text-ink-soft">· {group.category}</span>
              </span>
              <span className="block text-[11px] text-ink-soft">Đã nắm {groupMastered}/{groupQuestions.length}</span>
            </span>
          </button>
          <SpeakButton text={speechTextForGroup(group)} rate={rate} label="Nghe đoạn" className={GOLD_LISTEN_CLASS} />
        </div>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-col gap-2">
              <Transcript transcript={group.transcript} />
              {groupQuestions.map(renderQuestionCard)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPart(part: PartNumber) {
    const meta = PART_META.find((m) => m.part === part)!;
    const partQuestions = QUESTIONS.filter((q) => q.part === part);
    const anyVisible = partQuestions.some((q) => visible.get(q.id));
    if (!anyVisible) return null;
    const partMastered = partQuestions.filter((q) => mastered[q.id]).length;
    const isOpen = openParts[part] ?? true;
    return (
      <section
        key={part}
        className="rounded-2xl border border-line bg-white shadow-card transition-shadow duration-200 hover:shadow-lift"
        aria-label={meta.nameVi}
      >
        <button
          type="button"
          onClick={() => setOpenParts((prev) => ({ ...prev, [part]: !isOpen }))}
          aria-expanded={isOpen}
          className="flex w-full flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-left min-h-[56px]"
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            className={`shrink-0 text-brand-dark transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold text-brand-dark">{meta.nameVi}</span>
            <span className="block text-[11px] text-ink-soft">
              {meta.range} · {meta.count} câu · Đã nắm {partMastered}/{partQuestions.length}
            </span>
          </span>
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 border-t border-line p-3">
              {(part === 1 || part === 2)
                ? partQuestions.map(renderQuestionCard)
                : GROUPS.filter((g) => g.part === part).map(renderGroup)}
            </div>
          </div>
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">LISTENING REVISION · 28/11/2026</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" aria-label="Tốc độ đọc">
                {([0.8, 1] as SpeechRate[]).map((r) => (
                  <button key={r} type="button" onClick={() => setRate(r)} aria-pressed={rate === r} className={`rounded-md px-2.5 py-2 min-h-[40px] transition-all ${rate === r ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"}`}>
                    {r === 0.8 ? "0.8x" : "1.0x"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-bad/50 bg-white px-3 py-2 text-xs font-bold text-bad hover:bg-bad-soft min-h-[40px]"
              >
                Xoá lịch sử &amp; trạng thái đã nắm
              </button>
            </div>
          </div>
          <h1 className="animate-fade-up mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Ôn tập &amp; đáp án</h1>
          <p className="animate-fade-up mt-1 text-sm text-ink-soft" style={{ animationDelay: "80ms" }}>
            Toàn bộ 100 câu kèm đáp án đúng và transcript (cue <mark className="cue">(n)</mark> được highlight). Đã nắm{" "}
            <strong className="font-tabular text-ink">{mounted ? masteredCount : 0}/{TOTAL_QUESTIONS}</strong> câu.
          </p>

          <Link href="/listening/answer-check" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-brand bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand/20">
            Học thuộc đáp án câu 1–31 · Chấm điểm riêng
          </Link>

          {/* Thanh công cụ: filter + search */}
          <div className="sticky top-14 z-30 -mx-3 mt-4 border-b border-line/70 bg-paper/90 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Lọc câu">
                <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-md px-3 py-2 min-h-[40px] transition-all ${filter === "all" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                  Tất cả
                </button>
                <button type="button" onClick={() => setFilter("unmastered")} aria-pressed={filter === "unmastered"} className={`rounded-md px-3 py-2 min-h-[40px] transition-all ${filter === "unmastered" ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-brand-dark"}`}>
                  Chưa nắm
                </button>
              </div>
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Tìm trong câu hỏi, đáp án, transcript</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo nội dung, số câu, đáp án…"
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft min-h-[44px]"
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
                      const q = QUESTIONS.find((item) => item.id === id)!;
                      return (
                        <tr key={id} className="border-t border-line">
                          <td className="py-1.5 pr-2">
                            <a href={`#rq-${id}`} className="font-extrabold text-brand-dark underline decoration-dotted underline-offset-2 font-tabular">
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
            {([1, 2, 3, 4] as PartNumber[]).map(renderPart)}
            {QUESTIONS.every((q) => !visible.get(q.id)) && (
              <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink-soft">
                Không có câu nào khớp bộ lọc/từ khoá hiện tại.
              </p>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={deleteOpen}
        title="Xoá lịch sử & trạng thái đã nắm?"
        message={
          <>
            Toàn bộ <strong className="text-ink">lịch sử làm bài (tối đa 50 lần)</strong> và{" "}
            <strong className="text-ink">trạng thái “đã nắm” của 100 câu</strong> sẽ bị xoá vĩnh viễn khỏi trình duyệt này.
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
