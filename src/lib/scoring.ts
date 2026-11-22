import { PART_META, QUESTIONS, type PartNumber } from "@/data/exam";

export interface PerPartScore {
  part: number;
  correct: number;
  total: number;
}

export interface ScoreResult {
  raw: number;
  scaled: number;
  perPart: PerPartScore[];
}

/** Quy đổi ước lượng raw (0–100) sang thang Listening 5–495. KHÔNG phải điểm ETS chính thức. */
export function scaledFromRaw(raw: number): number {
  return Math.max(5, Math.round((raw / 100) * 495 / 5) * 5);
}

export function scoreAnswers(answers: Record<number, string>): ScoreResult {
  const perPart: PerPartScore[] = PART_META.map(({ part }) => {
    const qs = QUESTIONS.filter((q) => q.part === part);
    const correct = qs.filter((q) => answers[q.id] === q.answer).length;
    return { part, correct, total: qs.length };
  });
  const raw = perPart.reduce((sum, p) => sum + p.correct, 0);
  return { raw, scaled: scaledFromRaw(raw), perPart };
}

/** Part yếu nhất theo tỷ lệ đúng (tie → Part số nhỏ hơn). */
export function weakestPart(perPart: PerPartScore[]): PerPartScore {
  return [...perPart].sort((a, b) => a.correct / a.total - b.correct / b.total || a.part - b.part)[0];
}

export const PART_ADVICE: Record<PartNumber, string> = {
  1: "Ôn lại tranh tả người/vật: chú ý động từ chia ở thì hiện tại tiếp diễn và chủ ngữ số ít/nhiều. Nghe lại Part I nhiều lần, tập trung phân biệt các động từ dễ nhầm (polish/water/open…).",
  2: "Luyện phản xạ hỏi–đáp: tập trung vào từ để hỏi (When/Who/What/Why) và các câu không có từ để hỏi (Yes/No, gợi ý, đề nghị). Loại đáp án lặp từ giống câu hỏi nhưng sai ngữ nghĩa.",
  3: "Ôn Part III theo từng hội thoại: nghe câu hỏi trước khi nghe audio, gạch chân từ khóa (who/what/where/why + hành động tiếp theo). Luyện các câu hỏi “What does the man/woman imply…”.",
  4: "Ôn Part IV theo từng bài nói: xác định ngữ cảnh (announcement/talk/broadcast/message) ngay từ câu đầu. Chú ý câu hỏi về mục đích chính và hành động người nghe được khuyên làm.",
};
