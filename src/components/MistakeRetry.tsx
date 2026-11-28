import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import Modal from "@/components/Modal";
import type { AnswerKey, ExamOption } from "@/data/exam";
import { pickRetryQuestions, RETRY_LIMIT } from "@/lib/mistake-retry";

interface RetryQuestion {
  id: number;
  part: number;
  prompt: string;
  answer: AnswerKey;
  options: ExamOption[];
}

const primaryButton = "min-h-[44px] shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark";

export default function MistakeRetry<Q extends RetryQuestion>({ section, missed, renderContext }: {
  section: "listening" | "reading";
  missed: Q[];
  renderContext: (question: Q, previous?: Q) => ReactNode;
}) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [corrected, setCorrected] = useState<number | null>(null);
  const summary = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (corrected !== null) summary.current?.focus();
  }, [corrected]);

  if (missed.length === 0) return null;

  function start() {
    const selected = pickRetryQuestions(missed);
    setAnswers({});
    setCorrected(null);
    setQuestions(selected);
    track("mistake_retry_started", { section, total: selected.length });
  }

  return (
    <>
      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Ôn nhanh {Math.min(missed.length, RETRY_LIMIT)} câu</h2>
          <p className="mt-1 text-sm text-ink-soft">Luyện lại câu sai hoặc bỏ trống. Điểm bài gốc không thay đổi.</p>
        </div>
        <button type="button" onClick={start} className={primaryButton}>Làm lại câu sai</button>
      </section>
      {questions.length > 0 && (
        <Modal open onClose={() => setQuestions([])} label="Làm lại câu sai">
          <div className="min-h-full flex-none bg-paper px-3 py-5 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <header className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand">{section} · Ôn nhanh</p>
                  <h2 className="font-display text-2xl font-bold text-ink">Làm lại câu sai</h2>
                </div>
                <button type="button" onClick={() => setQuestions([])} className="min-h-[44px] rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-paper-deep">Đóng</button>
              </header>
              {corrected === null ? (
                <form onSubmit={(event) => {
                  event.preventDefault();
                  const count = questions.filter((q) => answers[q.id] === q.answer).length;
                  setCorrected(count);
                  track("mistake_retry_completed", { section, total: questions.length, corrected: count });
                }}>
                  <p className="mb-4 text-sm text-ink-soft">Chọn một phương án cho mỗi câu rồi chấm bài để xem đáp án.</p>
                  {questions.map((q, i) => (
                    <div key={q.id} className="mb-4 space-y-3 rounded-2xl border border-line bg-white p-4 shadow-card">
                      {renderContext(q, questions[i - 1])}
                      <fieldset className="min-w-0">
                        <legend className="font-bold text-ink">
                          <span className="block text-xs uppercase tracking-wide text-brand">Câu {q.id} · Part {q.part}</span>
                          {q.prompt || (q.part === 6 ? `Chọn đáp án cho chỗ trống [${q.id}].` : "Chọn câu mô tả đúng bức ảnh.")}
                        </legend>
                        <div className="mt-2 grid gap-2">
                          {q.options.map((opt) => (
                            <label key={opt.key} className="flex min-h-[44px] cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-brand has-checked:bg-brand-soft">
                              <input type="radio" required name={`retry-${q.id}`} value={opt.key} checked={answers[q.id] === opt.key} onChange={() => setAnswers({ ...answers, [q.id]: opt.key })} className="mt-1 accent-brand" />
                              <span><strong>{opt.key}.</strong> {opt.text}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-soft">Đã chọn {Object.keys(answers).length}/{questions.length} câu</span>
                    <button type="submit" className={primaryButton}>Chấm bài</button>
                  </div>
                </form>
              ) : (
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
                  <h3 ref={summary} tabIndex={-1} className="font-display text-xl font-bold text-ink">Đã sửa đúng {corrected}/{questions.length} câu</h3>
                  <p className="mt-1 text-sm text-ink-soft">Kết quả ôn nhanh không thay đổi điểm bài gốc.</p>
                  <ul className="my-4 divide-y divide-line">
                    {questions.map((q) => (
                      <li key={q.id} className="py-2 text-sm text-ink">
                        <strong>Câu {q.id}: </strong>
                        {answers[q.id] === q.answer ? <span className="font-bold text-ok">Đúng</span> : <span className="font-bold text-bad">Sai (bạn chọn {answers[q.id]})</span>}
                        <p>Đáp án: {q.answer}. {q.options.find((o) => o.key === q.answer)?.text}</p>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setQuestions([])} className={primaryButton}>Về kết quả bài gốc</button>
                </section>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
