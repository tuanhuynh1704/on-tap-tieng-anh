import { scaledFromRaw, scoreAnswers, type PerPartScore } from "@/lib/scoring";
import { QUESTIONS } from "@/data/exam";

export const DRAFT_KEY = "cdr.draft.v1";
export const HISTORY_KEY = "cdr.history.v1";
export const MASTERED_KEY = "cdr.mastered.v1";

export interface DraftData {
  answers: Record<number, string>;
  flags: number[];
  savedAt: number;
}

export interface AttemptRecord {
  id: string;
  date: number;
  raw: number;
  scaled: number;
  perPart: PerPartScore[];
  answers: Record<number, string>;
}

const MAX_HISTORY = 50;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ---------- Draft ----------
export function loadDraft(): DraftData | null {
  if (!canUseStorage()) return null;
  const d = safeParse<DraftData | null>(window.localStorage.getItem(DRAFT_KEY), null);
  if (!d || typeof d !== "object" || !d.answers) return null;
  return { answers: d.answers ?? {}, flags: Array.isArray(d.flags) ? d.flags : [], savedAt: d.savedAt ?? 0 };
}

export function saveDraft(answers: Record<number, string>, flags: number[]): DraftData {
  const data: DraftData = { answers, flags, savedAt: Date.now() };
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // quota — bỏ qua, không chặn UI
    }
  }
  return data;
}

export function clearDraft(): void {
  if (canUseStorage()) window.localStorage.removeItem(DRAFT_KEY);
}

// ---------- History ----------
export function loadHistory(): AttemptRecord[] {
  if (!canUseStorage()) return [];
  const list = safeParse<AttemptRecord[]>(window.localStorage.getItem(HISTORY_KEY), []);
  if (!Array.isArray(list)) return [];
  return list.filter((a) => 
    a && 
    typeof a.id === "string" && 
    typeof a.raw === "number" && isFinite(a.raw) &&
    typeof a.answers === "object" && a.answers !== null && !Array.isArray(a.answers) &&
    typeof a.scaled === "number" && isFinite(a.scaled) &&
    Array.isArray(a.perPart)
  ).map((a) => ({ ...a, scaled: scaledFromRaw(a.raw) }));
}

export function saveAttempt(answers: Record<number, string>): AttemptRecord {
  const { raw, scaled, perPart } = scoreAnswers(answers);
  const attempt: AttemptRecord = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: Date.now(),
    raw,
    scaled,
    perPart,
    answers,
  };
  if (canUseStorage()) {
    const list = [...loadHistory(), attempt].slice(-MAX_HISTORY);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch {
      // quota — bỏ qua
    }
  }
  return attempt;
}

export function getAttempt(id: string): AttemptRecord | undefined {
  return loadHistory().find((a) => a.id === id);
}

/** Lần làm trước attempt có `id` (theo thứ tự thời gian trong history). */
export function getPreviousAttempt(id: string): AttemptRecord | undefined {
  const list = loadHistory();
  const idx = list.findIndex((a) => a.id === id);
  return idx > 0 ? list[idx - 1] : undefined;
}

/** Xoá cả lịch sử làm bài lẫn trạng thái "đã nắm" — theo confirm rõ ràng ở UI. */
export function clearHistoryAndMastered(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(HISTORY_KEY);
  window.localStorage.removeItem(MASTERED_KEY);
}

// ---------- Mastered ----------
export function loadMastered(): Record<number, boolean> {
  if (!canUseStorage()) return {};
  const m = safeParse<Record<number, boolean>>(window.localStorage.getItem(MASTERED_KEY), {});
  return m && typeof m === "object" && !Array.isArray(m) ? m : {};
}

export function saveMastered(map: Record<number, boolean>): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(MASTERED_KEY, JSON.stringify(map));
  } catch {
    // quota — bỏ qua
  }
}

export function toggleMastered(id: number): Record<number, boolean> {
  const map = loadMastered();
  if (map[id]) {
    delete map[id];
  } else {
    map[id] = true;
  }
  saveMastered(map);
  return map;
}

// ---------- Thống kê ----------
export interface HistoryStats {
  attempts: number;
  bestScaled: number | null;
  avgScaled: number | null;
  /** [số câu, số lần sai] giảm dần theo số lần sai. */
  mostMissed: { id: number; wrong: number }[];
}

export function computeStats(history: AttemptRecord[], topN = 3): HistoryStats {
  if (history.length === 0) {
    return { attempts: 0, bestScaled: null, avgScaled: null, mostMissed: [] };
  }
  const bestScaled = Math.max(...history.map((a) => a.scaled));
  const avgScaled = history.reduce((s, a) => s + a.scaled, 0) / history.length;
  const wrongCount = new Map<number, number>();
  for (const attempt of history) {
    for (const q of QUESTIONS) {
      if (attempt.answers[q.id] !== q.answer) {
        wrongCount.set(q.id, (wrongCount.get(q.id) ?? 0) + 1);
      }
    }
  }
  const mostMissed = [...wrongCount.entries()]
    .map(([id, wrong]) => ({ id, wrong }))
    .sort((a, b) => b.wrong - a.wrong || a.id - b.id)
    .slice(0, topN);
  return { attempts: history.length, bestScaled, avgScaled, mostMissed };
}

/** Đếm số lần sai từng câu trên toàn bộ history (dùng cho bảng review). */
export function wrongCountByQuestion(history: AttemptRecord[]): Map<number, number> {
  const wrongCount = new Map<number, number>();
  for (const attempt of history) {
    for (const q of QUESTIONS) {
      if (attempt.answers[q.id] !== q.answer) {
        wrongCount.set(q.id, (wrongCount.get(q.id) ?? 0) + 1);
      }
    }
  }
  return wrongCount;
}
