import type { ExamGroup, ExamQuestion } from "@/data/exam";

export type SpeechRate = 0.8 | 1;

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

const SPEAKER_PREFIX = /^(M-[A-Za-z]+|W-[A-Za-z]+):\s*/;

/** Bỏ cue (n) khỏi text khi đọc. */
export function stripCues(text: string): string {
  return text.replace(/\(\d{1,3}\)\s*/g, "").replace(/\s{2,}/g, " ").trim();
}

/** Text đọc cho 1 item: Part I đọc "Number N." + 4 mệnh đề; Part II đọc câu hỏi + 3 đáp án; Part III/IV đọc transcript của group. */
export function speechTextForQuestion(q: ExamQuestion, group?: ExamGroup): string {
  if (q.part === 1) {
    const statements = q.options.map((o) => `${o.key}. ${o.text}`).join(". ");
    return `Number ${q.id}. ${statements}`;
  }
  if (q.part === 2) {
    const responses = q.options.map((o) => `${o.key}. ${o.text}`).join(". ");
    return `Number ${q.id}. ${q.prompt} ... ${responses}`;
  }
  if (group) return speechTextForGroup(group);
  return `Number ${q.id}. ${q.prompt}`;
}

/** Text đọc cho 1 group Part III/IV theo lượt thoại; M-/W- → Man:/Woman:; bỏ cue. */
export function speechTextForGroup(group: ExamGroup): string {
  const lines = group.transcript.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines
    .map((line) => {
      const m = line.match(SPEAKER_PREFIX);
      if (m) {
        const role = m[1].startsWith("M-") ? "Man: " : "Woman: ";
        return role + stripCues(line.slice(m[0].length));
      }
      return stripCues(line);
    })
    .join(" ");
}

export function speak(text: string, rate: SpeechRate): void {
  if (!isTtsSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = rate;
  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  window.speechSynthesis.cancel();
}
