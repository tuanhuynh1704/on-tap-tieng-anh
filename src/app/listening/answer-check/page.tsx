"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { QUESTIONS, type AnswerKey } from "@/data/exam";

const MEMORY_QUESTIONS = QUESTIONS.filter((question) => question.id >= 1 && question.id <= 31);
const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D"];

export default function ListeningAnswerCheckPage() {
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, AnswerKey | null>>({});
  const answeredCount = MEMORY_QUESTIONS.filter((question) => answers[question.id]).length;
  const checkedCount = Object.keys(checkedAnswers).length;
  const correctCount = MEMORY_QUESTIONS.filter((question) => checkedAnswers[question.id] === question.answer).length;
  const wrongCount = MEMORY_QUESTIONS.filter((question) => checkedAnswers[question.id] && checkedAnswers[question.id] !== question.answer).length;
  const blankCount = MEMORY_QUESTIONS.filter((question) => checkedAnswers[question.id] === null).length;

  function selectAnswer(id: number, answer: AnswerKey) {
    if (answers[id] === answer) return;
    setAnswers((previous) => ({ ...previous, [id]: answer }));
    setCheckedAnswers((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  function checkAll() {
    setCheckedAnswers(Object.fromEntries(MEMORY_QUESTIONS.map((question) => [question.id, answers[question.id] ?? null])));
  }

  function reset() {
    setAnswers({});
    setCheckedAnswers({});
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Listening · Học thuộc đáp án</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Kiểm tra đáp án câu 1–31</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-soft">
          Chọn A/B/C/D theo trí nhớ, kiểm tra từng câu hoặc chấm cả 31 câu. Đáp án đúng chỉ hiện sau khi kiểm tra.
          Điểm phần này tính riêng, không lưu vào điểm hoặc lịch sử bài thi Listening 100 câu.
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">Câu 1–6 chọn A/B/C/D; câu 7–31 chỉ chọn A/B/C. Ô D ở câu chỉ có ba lựa chọn được làm mờ và không thể chọn.</p>
        <Link href="/review" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-bold text-brand-dark hover:underline">Xem nội dung &amp; giải đáp Listening</Link>

        <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6" aria-label="Điểm luyện nhớ đáp án">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="status" aria-live="polite" aria-atomic="true">
              <p className="text-sm font-semibold text-ink">Đã chọn {answeredCount}/{MEMORY_QUESTIONS.length} câu</p>
              {checkedCount > 0 ? (
                <>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-dark">Điểm riêng: {correctCount}/{MEMORY_QUESTIONS.length} · {Math.round(correctCount / MEMORY_QUESTIONS.length * 100)}%</p>
                  <p className="mt-2 text-sm text-ink-soft">Đã kiểm tra {checkedCount}/31 câu: {correctCount} đúng · {wrongCount} sai · {blankCount} bỏ trống.</p>
                  {checkedCount < MEMORY_QUESTIONS.length && <p className="mt-1 text-xs text-ink-soft">Còn {MEMORY_QUESTIONS.length - checkedCount} câu chưa kiểm tra. Chọn “Chấm điểm 31 câu” để có kết quả toàn phần.</p>}
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">Chưa chấm điểm. Mỗi câu đúng được 1 điểm; sai hoặc bỏ trống được 0 điểm.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">Chấm điểm 31 câu</button>
              <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">Làm lại</button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MEMORY_QUESTIONS.map((question) => {
            const chosen = answers[question.id];
            const checked = checkedAnswers[question.id] !== undefined;
            const correct = checkedAnswers[question.id] === question.answer;
            return (
              <section key={question.id} className="rounded-2xl border border-line bg-white p-4 shadow-card" aria-labelledby={`memory-question-${question.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 id={`memory-question-${question.id}`} className="font-display text-lg font-bold text-ink">Câu {question.id}</h2>
                  <span className="text-xs font-semibold text-ink-soft">Part {question.part}</span>
                </div>
                <fieldset className="mt-3">
                  <legend className="sr-only">Chọn đáp án câu {question.id}</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {ANSWER_KEYS.map((key) => {
                      const disabled = !question.options.some((option) => option.key === key);
                      return (
                        <label key={key} title={disabled ? `Câu ${question.id} không có đáp án ${key}` : undefined} className={`relative ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                          <input type="radio" name={`memory-answer-${question.id}`} value={key} checked={chosen === key} disabled={disabled} onChange={() => selectAnswer(question.id, key)} className="peer sr-only" />
                          <span className={`flex min-h-[44px] items-center justify-center rounded-lg border text-sm font-bold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${disabled ? "border-line bg-paper text-ink-soft opacity-40" : chosen === key ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-paper text-ink hover:border-brand"}`}>{key}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <button type="button" onClick={() => setCheckedAnswers((previous) => ({ ...previous, [question.id]: chosen }))} disabled={!chosen || checked} aria-label={`Kiểm tra câu ${question.id}`} className="mt-3 min-h-[44px] w-full rounded-lg border border-brand px-3 py-2 text-sm font-bold text-brand-dark hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40">Kiểm tra đáp án</button>
                <div className="mt-3 text-sm" role="status" aria-live="polite" aria-atomic="true">
                  {checked ? (
                    <p className={`rounded-lg px-3 py-2 font-semibold ${correct ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                      {correct ? `Đúng! Bạn chọn ${chosen}.` : chosen ? `Sai. Bạn chọn ${chosen}.` : "Chưa chọn đáp án (0 điểm)."}
                      <span className="mt-1 block">Đáp án đúng: {question.answer}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-ink-soft">{chosen ? `Đã chọn ${chosen}. Bấm kiểm tra để xem đúng/sai.` : "Chọn một đáp án để kiểm tra."}</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">Chấm điểm 31 câu</button>
          <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">Làm lại</button>
        </div>
      </main>
    </div>
  );
}
