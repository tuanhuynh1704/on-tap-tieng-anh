"use client";

import Link from "next/link";
import { useState } from "react";
import ReadingDocumentCard from "@/components/ReadingDocumentCard";
import SiteHeader from "@/components/SiteHeader";
import type { AnswerKey } from "@/data/exam";
import {
  getReadingPassagesByPart,
  getReadingQuestionsByPart,
  getReadingQuestionById,
  READING_PART_META,
  type ReadingPartNumber,
  type ReadingPassage,
  type ReadingQuestion,
} from "@/data/reading";

const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D"];

const MEMORY_PAGES = [
  { part: 5, label: "Part 5", href: "/reading/answer-check" },
  { part: 6, label: "Part 6", href: "/reading/answer-check/part-6" },
  { part: 7, label: "Part 7", href: "/reading/answer-check/part-7" },
] as const;

function hasCheckedAnswer(answers: Record<number, AnswerKey | null>, id: number): boolean {
  return Object.prototype.hasOwnProperty.call(answers, id);
}

export default function ReadingAnswerCheck({ part }: { part: ReadingPartNumber }) {
  const questions = getReadingQuestionsByPart(part);
  const passages = part === 5 ? [] : getReadingPassagesByPart(part);
  const partMeta = READING_PART_META.find((meta) => meta.part === part)!;
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, AnswerKey | null>>({});

  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const checkedCount = questions.filter((question) => hasCheckedAnswer(checkedAnswers, question.id)).length;
  const correctCount = questions.filter((question) => checkedAnswers[question.id] === question.answer).length;
  const wrongCount = questions.filter(
    (question) => hasCheckedAnswer(checkedAnswers, question.id) && checkedAnswers[question.id] !== null && checkedAnswers[question.id] !== question.answer,
  ).length;
  const blankCount = questions.filter((question) => checkedAnswers[question.id] === null).length;

  function selectAnswer(id: number, answer: AnswerKey) {
    if (answers[id] === answer) return;
    setAnswers((previous) => ({ ...previous, [id]: answer }));
    setCheckedAnswers((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  function checkQuestion(id: number) {
    setCheckedAnswers((previous) => ({ ...previous, [id]: answers[id] ?? null }));
  }

  function checkAll() {
    const next: Record<number, AnswerKey | null> = {};
    for (const question of questions) next[question.id] = answers[question.id] ?? null;
    setCheckedAnswers(next);
  }

  function reset() {
    setAnswers({});
    setCheckedAnswers({});
  }

  function renderQuestionCard(question: ReadingQuestion) {
    const chosen = answers[question.id];
    const checked = hasCheckedAnswer(checkedAnswers, question.id);
    const correct = checkedAnswers[question.id] === question.answer;
    const answerText = question.options.find((option) => option.key === question.answer)?.text;
    const promptId = `reading-memory-prompt-${question.id}`;

    return (
      <section
        key={question.id}
        className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lift sm:p-5"
        aria-labelledby={`reading-memory-question-${question.id}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={`reading-memory-question-${question.id}`} className="font-display text-lg font-bold text-ink">
            Câu {question.id}
          </h2>
          <span className="text-xs font-semibold text-ink-soft">Part {question.part}</span>
        </div>

        {question.prompt ? (
          <p id={promptId} lang="en" className="mt-3 text-sm font-semibold leading-6 text-ink">
            {question.prompt}
          </p>
        ) : (
          <p id={promptId} className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Chọn từ/cụm từ cho chỗ trống trong đoạn đọc
          </p>
        )}

        <fieldset className="mt-3" aria-describedby={promptId}>
          <legend className="sr-only">Chọn đáp án câu {question.id}</legend>
          <div className="flex flex-col gap-2">
            {ANSWER_KEYS.map((key) => {
              const option = question.options.find((item) => item.key === key);
              if (!option) return null;
              const selected = chosen === key;
              return (
                <label key={key} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name={`reading-memory-answer-${question.id}`}
                    value={key}
                    checked={selected}
                    onChange={() => selectAnswer(question.id, key)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex min-h-[44px] items-start gap-3 rounded-lg border px-3 py-2.5 text-sm leading-6 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
                      selected ? "border-brand bg-brand-soft font-semibold text-brand-dark" : "border-line bg-paper text-ink hover:border-brand"
                    }`}
                  >
                    <span className="shrink-0 font-bold">{key}.</span>
                    <span lang="en" className="min-w-0 break-words">{option.text}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => checkQuestion(question.id)}
          disabled={!chosen || checked}
          className="mt-3 min-h-[44px] w-full rounded-lg border border-brand px-3 py-2 text-sm font-bold text-brand-dark hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Kiểm tra câu {question.id}
        </button>

        <div className="mt-3 text-sm" role="status" aria-live="polite" aria-atomic="true">
          {checked ? (
            <p className={`rounded-lg px-3 py-2 font-semibold ${correct ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
              {correct ? `Đúng! Bạn chọn ${chosen}.` : chosen ? `Sai. Bạn chọn ${chosen}.` : "Chưa chọn đáp án (0 điểm)."}
              <span className="mt-1 block">
                Đáp án đúng: {question.answer}. <span lang="en">{answerText}</span>
              </span>
            </p>
          ) : (
            <p className="text-xs text-ink-soft">{chosen ? `Đã chọn ${chosen}. Bấm kiểm tra để xem đúng/sai.` : "Chọn một đáp án để kiểm tra."}</p>
          )}
        </div>
      </section>
    );
  }

  function renderPassage(passage: ReadingPassage) {
    return (
      <section key={passage.id} className="rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4" aria-labelledby={`reading-memory-passage-${passage.id}`}>
        <div className="border-b border-line/70 pb-4">
          <p id={`reading-memory-passage-${passage.id}`} className="text-xs italic leading-5 text-ink-soft">
            {passage.intro}
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-3">
            {passage.documents.map((document) => (
              <ReadingDocumentCard key={document.id} doc={document} />
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {passage.questionIds.map((id) => renderQuestionCard(getReadingQuestionById(id)!))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-10 sm:pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Reading · Học thuộc đáp án</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Học thuộc đáp án Reading {partMeta.name.split(" — ")[0]}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-soft">
          {partMeta.range} · {partMeta.count} câu. Đọc câu hỏi và đoạn văn, chọn đáp án theo trí nhớ, rồi kiểm tra từng câu hoặc chấm cả phần.
          {" "}Đáp án đúng chỉ hiện sau khi kiểm tra. Điểm phần này tính riêng, không lưu vào điểm hoặc lịch sử bài thi Reading 100 câu.
        </p>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Chọn phần học thuộc đáp án Reading">
          {MEMORY_PAGES.map((page) => (
            <Link
              key={page.part}
              href={page.href}
              aria-current={part === page.part ? "page" : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-xl border px-4 py-2.5 text-sm font-bold ${part === page.part ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white text-ink-soft hover:border-brand hover:text-brand-dark"}`}
            >
              {page.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/reading/review" className="inline-flex min-h-[44px] items-center text-sm font-bold text-brand-dark hover:underline">
            Xem nội dung &amp; giải đáp Reading
          </Link>
          <Link href="/reading" className="inline-flex min-h-[44px] items-center text-sm font-bold text-brand-dark hover:underline">
            Về Reading
          </Link>
        </div>

        <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6" aria-label="Điểm luyện nhớ đáp án Reading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="status" aria-live="polite" aria-atomic="true">
              <p className="text-sm font-semibold text-ink">Đã chọn {answeredCount}/{questions.length} câu</p>
              {checkedCount > 0 ? (
                <>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-dark">
                    Điểm riêng: {correctCount}/{questions.length} · {Math.round((correctCount / questions.length) * 100)}%
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Đã kiểm tra {checkedCount}/{questions.length} câu: {correctCount} đúng · {wrongCount} sai · {blankCount} bỏ trống.
                  </p>
                  {checkedCount < questions.length && (
                    <p className="mt-1 text-xs text-ink-soft">Còn {questions.length - checkedCount} câu chưa kiểm tra. Chọn “Chấm điểm {questions.length} câu” để có kết quả toàn phần.</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">Chưa chấm điểm. Mỗi câu đúng được 1 điểm; sai hoặc bỏ trống được 0 điểm.</p>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
                Chấm điểm {questions.length} câu
              </button>
              <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">
                Làm lại
              </button>
            </div>
          </div>
        </section>

        {part === 5 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{questions.map(renderQuestionCard)}</div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">{passages.map(renderPassage)}</div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 pb-4 sm:flex sm:flex-wrap sm:justify-center">
          <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
            Chấm điểm {questions.length} câu
          </button>
          <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">
            Làm lại
          </button>
        </div>
      </main>
    </div>
  );
}
