"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  PART_META,
  QUESTIONS,
  getGroupForQuestion,
  type ExamQuestion,
} from "@/data/exam";
import {
  READING_PART_META,
  READING_QUESTIONS,
  getReadingPassageForQuestion,
  type ReadingBlock,
  type ReadingQuestion,
} from "@/data/reading";
import {
  READING_PART5_EXPLANATIONS,
  READING_PART5_OPTION_TRANSLATIONS,
} from "@/data/reading-part5-explanations";
import {
  LISTENING_TRANSLATIONS,
  READING_PART6_ANSWER_TYPES,
  READING_TRANSLATIONS,
} from "@/data/question-translations";

type Module = "listening" | "reading";

function passageBlockText(block: ReadingBlock): string {
  switch (block.type) {
    case "email": return `${block.subject}\n${block.body.join(" ")}`;
    case "table": return `${block.headers.join(" · ")}\n${block.rows.map((row) => row.join(" · ")).join("\n")}`;
    case "list": return block.items.join(" · ");
    case "quote": return `${block.text} ${block.attribution}`;
    case "chat": return `${block.author}: ${block.text}`;
    case "meta": return block.lines.join(" · ");
    case "box": return `${block.label}: ${block.lines.join(" · ")}`;
    case "divider": return "";
    default: return block.text;
  }
}

function ListeningExplanation({ question }: { question: ExamQuestion }) {
  const group = getGroupForQuestion(question);
  const translation = LISTENING_TRANSLATIONS[question.id];
  const answer = question.options.find((option) => option.key === question.answer);
  const evidence = group?.transcript.match(new RegExp(`[^.!?]*\\(${question.id}\\)[^.!?]*[.!?]?`))?.[0]?.trim();

  return (
    <div className="space-y-4 text-sm leading-6">
      {question.image && (
        <Image src={question.image} alt={question.imageAlt ?? `Ảnh câu ${question.id}`} width={900} height={600} className="max-h-72 w-full rounded-xl border border-line bg-paper object-contain" />
      )}
      <div className="rounded-xl bg-paper p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Câu hỏi / tình huống</p>
        <p className="mt-1 font-semibold text-ink">{question.prompt || question.imageAlt}</p>
        {translation?.prompt && <p className="mt-2 text-ink-soft"><strong>Dịch câu:</strong> {translation.prompt}</p>}
      </div>
      {evidence && (
        <div className="rounded-xl border border-brand/20 bg-brand-soft/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-dark">Manh mối trong transcript</p>
          <p className="mt-1">{evidence}</p>
          <p className="mt-1 text-xs text-ink-soft">Đối chiếu câu có cue ({question.id}) với câu hỏi; đáp án đúng diễn đạt lại thông tin này.</p>
        </div>
      )}
      <div>
        <h4 className="font-bold text-ink">Đáp án {question.answer}: {answer?.text}</h4>
        <p className="mt-1 text-ink-soft">
          {question.part === 1
            ? `Đối chiếu từng hành động và vật thể với ảnh (${question.imageAlt ?? "ảnh câu hỏi"}); đáp án ${question.answer} mô tả chi tiết nhìn thấy được.`
            : question.part === 2
              ? question.id === 8
                ? "“When” hỏi thời điểm; “By the end of this week” là cụm chỉ hạn chót nên trả lời đúng trọng tâm."
                : "Chọn phản hồi phù hợp chức năng câu nói: khớp từ hỏi hoặc đáp lại trực tiếp ý kiến/yêu cầu; không chọn chỉ vì lặp từ khóa."
              : "Đáp án khớp thông tin hoặc hàm ý trong transcript; dùng câu có cue để kiểm chứng trước khi loại các lựa chọn còn lại."}
        </p>
      </div>
      <ul className="space-y-2">
        {question.options.map((option, index) => (
          <li key={option.key} className={`rounded-lg border p-3 text-ink ${option.key === question.answer ? "border-ok/40 bg-ok-soft" : "border-line bg-white"}`}>
            <strong className="text-ink">{option.key}. {option.text}</strong>
            {translation?.options[index] && <p className="mt-1 text-xs text-ink-soft"><strong>Dịch đáp án:</strong> {translation.options[index]}</p>}
            {option.key === question.answer
              ? <span className="ml-2 text-xs font-bold text-ok">Đáp án đúng</span>
              : <p className="mt-1 text-xs text-ink-soft">Loại: lựa chọn này không trả lời đúng yêu cầu hoặc không khớp manh mối trong bài nghe.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadingExplanation({ question }: { question: ReadingQuestion }) {
  const part5Guide = READING_PART5_EXPLANATIONS[question.id];
  const translation = READING_TRANSLATIONS[question.id];
  const passage = getReadingPassageForQuestion(question);
  const answer = question.options.find((option) => option.key === question.answer);
  const context = passage?.documents.flatMap((doc) => [doc.title, doc.subtitle, ...doc.blocks.map(passageBlockText)])
    .filter(Boolean).join(" ").replace(/\s+/g, " ") ?? "";
  const evidence = answer ? context.match(new RegExp(`[^.!?]*${answer.text.split(/\s+/).filter((word) => word.length > 4).slice(0, 2).join(".*?")}[^.!?]*[.!?]?`, "i"))?.[0] : "";

  return (
    <div className="space-y-4 text-sm leading-6">
      <div className="rounded-xl bg-paper p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Câu hỏi / câu có chỗ trống</p>
        <p className="mt-1 font-semibold text-ink">{question.prompt || `Câu ${question.id} — chỗ trống trong đoạn văn bên dưới`}</p>
        {part5Guide && <p className="mt-2 text-ink-soft"><strong>Dịch:</strong> {part5Guide.translation}</p>}
        {!part5Guide && translation?.prompt && <p className="mt-2 text-ink-soft"><strong>Dịch câu:</strong> {translation.prompt}</p>}
      </div>
      {question.part === 5 && (
        <div className="rounded-xl border border-brand/20 bg-brand-soft/50 p-4">
          <p className="font-bold text-brand-dark">Cách xét từ loại và thì</p>
          <p className="mt-1 text-ink-soft">{part5Guide?.reason ?? "Nhìn vị trí chỗ trống (trước/sau danh từ, động từ, tính từ), dấu hiệu chia động từ và chủ ngữ để xác định từ loại, thì, sự hòa hợp và thể chủ động/bị động."}</p>
        </div>
      )}
      {evidence && (
        <div className="rounded-xl border border-brand/20 bg-brand-soft/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-dark">Manh mối trong đoạn</p>
          <p className="mt-1">…{evidence}…</p>
          <p className="mt-1 text-xs text-ink-soft">Đáp án đúng khớp chi tiết hoặc ý diễn đạt lại trong văn bản.</p>
        </div>
      )}
      {passage && !evidence && <p className="rounded-xl bg-paper p-4 text-xs text-ink-soft">Đọc lại bộ đoạn {passage.intro} và dò đúng câu chứa thông tin trước khi chọn.</p>}
      <div>
        <h4 className="font-bold text-ink">Đáp án {question.answer}: {answer?.text}</h4>
        {part5Guide && (
          <div className="mt-2 space-y-1 text-xs text-ink-soft">
            <p><strong>Dịch đáp án:</strong> {part5Guide.answerTranslation}</p>
            <p><strong>Từ loại / cấu trúc:</strong> {part5Guide.partOfSpeech}</p>
          </div>
        )}
        {!part5Guide && READING_PART6_ANSWER_TYPES[question.id] && (
          <p className="mt-2 text-xs text-ink-soft"><strong>Từ loại / cấu trúc đáp án:</strong> {READING_PART6_ANSWER_TYPES[question.id]}</p>
        )}
      </div>
      <ul className="space-y-2">
        {question.options.map((option, index) => (
          <li key={option.key} className={`rounded-lg border p-3 text-ink ${option.key === question.answer ? "border-ok/40 bg-ok-soft" : "border-line bg-white"}`}>
            <strong className="text-ink">{option.key}. {option.text}</strong>
            {READING_PART5_OPTION_TRANSLATIONS[question.id]?.[option.key] && (
              <p className="mt-1 text-xs text-ink-soft"><strong>Dịch:</strong> {READING_PART5_OPTION_TRANSLATIONS[question.id][option.key]}</p>
            )}
            {!part5Guide && translation?.options[index] && <p className="mt-1 text-xs text-ink-soft"><strong>Dịch đáp án:</strong> {translation.options[index]}</p>}
            {option.key === question.answer
              ? <span className="ml-2 text-xs font-bold text-ok">Đáp án đúng</span>
              : <p className="mt-1 text-xs text-ink-soft">Loại: lựa chọn này không phù hợp cấu trúc hoặc không được thông tin trong ngữ cảnh hỗ trợ.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function QuestionExplanationExplorer() {
  const [module, setModule] = useState<Module>("listening");
  const [part, setPart] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [selectedId, setSelectedId] = useState(1);

  const partOptions = module === "listening" ? PART_META : READING_PART_META;
  const allQuestions = useMemo(() => module === "listening" ? QUESTIONS : READING_QUESTIONS, [module]);
  const questions = allQuestions.filter((question) => question.part === part);
  const selectedQuestion = allQuestions.find((question) => question.id === selectedId);

  function changeModule(nextModule: Module) {
    setModule(nextModule);
    setPart(nextModule === "listening" ? 1 : 5);
    setSelectedId(1);
  }

  function changePart(nextPart: typeof part) {
    setPart(nextPart);
    const firstQuestion = allQuestions.find((question) => question.part === nextPart);
    if (firstQuestion) setSelectedId(firstQuestion.id);
  }

  function moveQuestion(direction: -1 | 1) {
    const nextQuestion = allQuestions.find((question) => question.id === selectedId + direction);
    if (!nextQuestion) return;
    setSelectedId(nextQuestion.id);
    setPart(nextQuestion.part);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7" aria-labelledby="question-explanations-title">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">200 CÂU · TRA CỨU THEO TỪNG CÂU</p>
        <h2 id="question-explanations-title" className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">Giải thích chi tiết Listening &amp; Reading</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">Chọn môn, Part và bấm vào số câu để xem đáp án, manh mối, phân tích cách chọn và loại phương án nhiễu.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line bg-paper-deep p-1 text-xs font-bold" role="group" aria-label="Chọn môn">
          {(["listening", "reading"] as const).map((item) => (
            <button key={item} type="button" onClick={() => changeModule(item)} aria-pressed={module === item} className={`min-h-[40px] rounded-md px-4 ${module === item ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft"}`}>
              {item === "listening" ? "Listening · 100 câu" : "Reading · 100 câu"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc Part">
          {partOptions.map((item) => (
            <button key={item.part} type="button" onClick={() => changePart(item.part)} aria-pressed={part === item.part} className={`min-h-[40px] rounded-lg border px-3 text-xs font-bold ${part === item.part ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-brand"}`}>
              Part {item.part} · {item.count} câu
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" aria-label={`Danh sách câu hỏi ${module}`}>
        {questions.map((question) => (
          <button key={question.id} type="button" onClick={() => setSelectedId(question.id)} aria-pressed={selectedId === question.id} aria-label={`Xem giải thích câu ${question.id}`} className={`min-h-[44px] rounded-lg border text-sm font-bold transition-colors ${selectedId === question.id ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink hover:border-brand hover:bg-brand-soft"}`}>
            {question.id}
          </button>
        ))}
      </div>

      {selectedQuestion ? (
        <div className="mt-5 rounded-2xl border border-brand/25 bg-white p-4 sm:p-6" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <button type="button" onClick={() => moveQuestion(-1)} disabled={selectedId === 1} aria-label="Câu trước" className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-line px-3 text-sm font-bold text-ink-soft hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">←</span><span className="hidden sm:inline">Trước</span>
            </button>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-center">
              <h3 className="font-display text-lg font-bold text-ink">{module === "listening" ? "Listening" : "Reading"} · Part {selectedQuestion.part} · Câu {selectedQuestion.id}</h3>
              <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-bold text-ok">Đáp án {selectedQuestion.answer}</span>
            </div>
            <button type="button" onClick={() => moveQuestion(1)} disabled={selectedId === 100} aria-label="Câu kế tiếp" className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-brand bg-brand px-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
              <span className="hidden sm:inline">Tiếp</span><span aria-hidden="true">→</span>
            </button>
          </div>
          {module === "listening"
            ? <ListeningExplanation question={selectedQuestion as ExamQuestion} />
            : <ReadingExplanation question={selectedQuestion as ReadingQuestion} />}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <button type="button" onClick={() => moveQuestion(-1)} disabled={selectedId === 1} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">←</span> Câu trước
            </button>
            <span className="text-xs font-semibold text-ink-soft">Câu {selectedId}/100</span>
            <button type="button" onClick={() => moveQuestion(1)} disabled={selectedId === 100} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
              Câu kế tiếp <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-paper p-4 text-sm text-ink-soft">Bấm một số câu ở trên để mở phần giải thích.</p>
      )}
    </section>
  );
}
