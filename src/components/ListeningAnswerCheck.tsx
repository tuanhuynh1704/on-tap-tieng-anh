"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Transcript from "@/components/Transcript";
import { GROUPS, QUESTIONS, type AnswerKey, type ExamGroup, type ExamQuestion } from "@/data/exam";
import { formatScaledScore, scoreMemorizationAnswers } from "@/lib/scoring";

const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D"];
const MEMORY_PAGES = [
  { part: "1-2", label: "Part 1-2", href: "/listening/answer-check" },
  { part: 3, label: "Part 3", href: "/listening/answer-check/part-3" },
  { part: 4, label: "Part 4", href: "/listening/answer-check/part-4" },
] as const;

export default function ListeningAnswerCheck({ part }: { part: "1-2" | 3 | 4 }) {
  const questions = QUESTIONS.filter((question) => part === "1-2" ? question.part === 1 || question.part === 2 : question.part === part);
  const showQuestionContent = part !== "1-2";
  const partLabel = `Part ${part}`;
  const questionRange = `${questions[0].id}–${questions[questions.length - 1].id}`;
  const questionCount = questions.length;
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, AnswerKey | null>>({});
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const { checked: checkedCount, correct: correctCount, wrong: wrongCount, blank: blankCount, remaining, percentage, scaled, maxScaled } = scoreMemorizationAnswers(questions, checkedAnswers);

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
    setCheckedAnswers(Object.fromEntries(questions.map((question) => [question.id, answers[question.id] ?? null])));
  }

  function reset() {
    setAnswers({});
    setCheckedAnswers({});
  }

  function renderQuestionCard(question: ExamQuestion) {
    const chosen = answers[question.id];
    const checked = checkedAnswers[question.id] !== undefined;
    const correct = checkedAnswers[question.id] === question.answer;
    const QuestionHeading = showQuestionContent ? "h3" : "h2";

    return (
      <section key={question.id} className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-card" aria-labelledby={`memory-question-${question.id}`}>
        <div className="flex items-center justify-between gap-2">
          <QuestionHeading id={`memory-question-${question.id}`} className="font-display text-lg font-bold text-ink">Câu {question.id}</QuestionHeading>
          <span className="text-xs font-semibold text-ink-soft">Part {question.part}</span>
        </div>
        {showQuestionContent && (
          <>
            <p id={`memory-prompt-${question.id}`} lang="en" className="mt-3 text-sm font-semibold leading-6 text-ink">{question.prompt}</p>
            {question.graphic && (
              <Image
                src={question.graphic}
                alt={question.graphicAlt ?? `Hình minh họa câu ${question.id}`}
                width={520}
                height={340}
                className="mt-3 h-auto w-full rounded-lg border border-line object-contain"
                sizes="(max-width: 1023px) 100vw, 480px"
              />
            )}
          </>
        )}
        <fieldset className="mt-3" aria-describedby={showQuestionContent ? `memory-prompt-${question.id}` : undefined}>
          <legend className="sr-only">Chọn đáp án câu {question.id}</legend>
          <div className={showQuestionContent ? "flex flex-col gap-2" : "grid grid-cols-4 gap-2"}>
            {ANSWER_KEYS.map((key) => {
              const option = question.options.find((item) => item.key === key);
              const disabled = !option;
              return (
                <label key={key} title={disabled ? `Câu ${question.id} không có đáp án ${key}` : undefined} className={`relative ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input type="radio" name={`memory-answer-${question.id}`} value={key} checked={chosen === key} disabled={disabled} onChange={() => selectAnswer(question.id, key)} className="peer sr-only" />
                  <span className={`flex min-h-[44px] rounded-lg border text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${showQuestionContent ? "items-start gap-3 px-3 py-2.5 leading-6" : "items-center justify-center font-bold"} ${disabled ? "border-line bg-paper text-ink-soft opacity-40" : chosen === key ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-paper text-ink hover:border-brand"}`}>
                    <span className="shrink-0 font-bold">{key}{showQuestionContent ? "." : ""}</span>
                    {showQuestionContent && <span lang="en" className="min-w-0 break-words">{option?.text}</span>}
                  </span>
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
              <span className="mt-1 block">Đáp án đúng: {question.answer}{showQuestionContent && <>. <span lang="en">{question.options.find((option) => option.key === question.answer)?.text}</span></>}</span>
            </p>
          ) : (
            <p className="text-xs text-ink-soft">{chosen ? `Đã chọn ${chosen}. Bấm kiểm tra để xem đúng/sai.` : "Chọn một đáp án để kiểm tra."}</p>
          )}
        </div>
      </section>
    );
  }

  function renderQuestionGroup(group: ExamGroup) {
    const groupQuestions = group.questionIds
      .map((id) => questions.find((question) => question.id === id))
      .filter((question): question is ExamQuestion => question !== undefined);
    const firstId = group.questionIds[0];
    const lastId = group.questionIds[group.questionIds.length - 1];

    return (
      <section key={group.id} className="rounded-2xl border border-line bg-paper-deep/50 p-3 sm:p-4" aria-labelledby={`memory-group-${group.id}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`memory-group-${group.id}`} className="font-display text-lg font-bold text-ink">Cụm câu {firstId}–{lastId}</h2>
          <span className="text-xs font-semibold text-ink-soft">Đoạn nghe · {groupQuestions.length} câu</span>
        </div>
        <details className="mt-3 rounded-xl border border-line bg-white/70 p-3">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-bold text-brand-dark">Mở transcript đoạn nghe</summary>
          <div className="mt-2"><Transcript transcript={group.transcript} /></div>
        </details>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">{groupQuestions.map(renderQuestionCard)}</div>
      </section>
    );
  }

  const groups = GROUPS.filter((group) => group.part === part);

  return (
    <div className="animate-page-enter flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pt-10 sm:pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Listening · Học thuộc đáp án</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Học thuộc đáp án Listening {partLabel}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-soft">
          Câu {questionRange} · {questionCount} câu. {showQuestionContent ? "Đọc đầy đủ câu hỏi và các lựa chọn, chọn đáp án theo trí nhớ, rồi kiểm tra từng câu hoặc chấm cả phần." : `Chọn A/B/C/D theo trí nhớ, kiểm tra từng câu hoặc chấm cả ${questionCount} câu.`}
          {" "}Đáp án đúng chỉ hiện sau khi kiểm tra. Điểm phần này tính riêng, không lưu vào điểm hoặc lịch sử bài thi Listening 100 câu.
        </p>
        {!showQuestionContent && (
          <p className="mt-2 text-xs leading-5 text-ink-soft">Câu 1–6 chọn A/B/C/D; câu 7–31 chỉ chọn A/B/C. Ô D ở câu chỉ có ba lựa chọn được làm mờ và không thể chọn.</p>
        )}
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Chọn phần học thuộc đáp án Listening">
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
        <Link href="/review" className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-brand-dark hover:underline">Xem nội dung &amp; giải đáp Listening</Link>

        <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6" aria-label="Điểm luyện nhớ đáp án">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="status" aria-live="polite" aria-atomic="true">
              <p className="text-sm font-semibold text-ink">Đã chọn {answeredCount}/{questionCount} câu</p>
              {checkedCount > 0 ? (
                <>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-dark">Điểm riêng: {correctCount}/{questionCount} · {percentage}%</p>
                  <p className="mt-1 text-lg font-bold text-brand-dark">Điểm quy đổi{remaining > 0 ? " tạm tính" : ""}: {formatScaledScore(scaled)}/{formatScaledScore(maxScaled)}</p>
                  <p className="mt-2 text-sm text-ink-soft">Đã kiểm tra {checkedCount}/{questionCount} câu: {correctCount} đúng · {wrongCount} sai · {blankCount} bỏ trống.</p>
                  {remaining > 0 && <p className="mt-1 text-xs text-ink-soft">Còn {remaining} câu chưa kiểm tra. Chọn “Chấm điểm {questionCount} câu” để có kết quả toàn phần.</p>}
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">Chưa chấm điểm. Mỗi câu đúng được 1 điểm; sai hoặc bỏ trống được 0 điểm.</p>
              )}
              <p className="mt-2 max-w-2xl text-xs leading-5 text-ink-soft">Điểm quy đổi = số câu đúng × 4,95; tối đa {formatScaledScore(maxScaled)} điểm cho {partLabel}. Đây là điểm ước lượng, không phải điểm TOEIC chính thức.</p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">Chấm điểm {questionCount} câu</button>
              <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">Làm lại</button>
            </div>
          </div>
        </section>

        {showQuestionContent ? (
          <div className="mt-5 flex flex-col gap-5">{groups.map(renderQuestionGroup)}</div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{questions.map(renderQuestionCard)}</div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <button type="button" onClick={checkAll} disabled={answeredCount === 0} className="min-h-[44px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">Chấm điểm {questionCount} câu</button>
          <button type="button" onClick={reset} disabled={answeredCount === 0 && checkedCount === 0} className="min-h-[44px] rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">Làm lại</button>
        </div>
      </main>
    </div>
  );
}
