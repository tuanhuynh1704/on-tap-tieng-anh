/*
 * verify_review.mjs — QA verify cho bộ code website ôn TOEIC Listening (repo on-tap-ta-cdr).
 * Zero-dep. Chạy: node --experimental-strip-types docs/extracted/verify_review/verify_review.mjs
 *
 * Tạo các bản sao import từ src/ (verify_exam.ts, verify_scoring.ts, verify_storage.ts, verify_tts.ts)
 * và chạy các kiểm tra định nghĩa theo spec/PRD + độc lập hóa mock window/localStorage/speechSynthesis.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = "docs/extracted/verify_review";
fs.mkdirSync(path.join(ROOT, DIR), { recursive: true });
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
fs.writeFileSync(path.join(ROOT, DIR, "verify_exam.ts"), read("src/data/exam.ts"));
fs.writeFileSync(path.join(ROOT, DIR, "verify_scoring.ts"), read("src/lib/scoring.ts").replaceAll('from "@/data/exam"', 'from "./verify_exam.ts"'));
fs.writeFileSync(path.join(ROOT, DIR, "verify_storage.ts"), read("src/lib/storage.ts").replaceAll('from "@/lib/scoring"', 'from "./verify_scoring.ts"').replaceAll('from "@/data/exam"', 'from "./verify_exam.ts"'));
fs.writeFileSync(path.join(ROOT, DIR, "verify_tts.ts"), read("src/lib/tts.ts").replaceAll('from "@/data/exam"', 'from "./verify_exam.ts"'));

const exam = await import("./verify_exam.ts");
const scoring = await import("./verify_scoring.ts");
const storage = await import("./verify_storage.ts");
const tts = await import("./verify_tts.ts");

let pass = 0;
const fails = [];
function check(name, cond, extra) {
  if (cond) pass++;
  else fails.push(name + (extra ? ` — ${String(extra)}` : ""));
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond || extra == null ? "" : ` — ${String(extra)}`}`);
}

// ---------- A. exam.ts: dữ liệu ----------
check("A1 questions.length === 100", exam.QUESTIONS.length === 100, String(exam.QUESTIONS.length));
const ids = exam.QUESTIONS.map((q) => q.id);
check("A2 ids là 1..100 duy nhất", new Set(ids).size === 100 && JSON.stringify(ids) === JSON.stringify(Array.from({ length: 100 }, (_, i) => i + 1)));
const byPart = {};
for (const q of exam.QUESTIONS) byPart[q.part] = (byPart[q.part] ?? 0) + 1;
check("A3 số câu theo Part {1:6,2:25,3:39,4:30}", JSON.stringify(byPart) === JSON.stringify({ 1: 6, 2: 25, 3: 39, 4: 30 }), JSON.stringify(byPart));
check("A4 PART_META.count khớp số câu thực", exam.PART_META.every((m) => exam.QUESTIONS.filter((q) => q.part === m.part).length === m.count));
check("A5 ids P1 = 1–6", JSON.stringify(exam.QUESTIONS.filter((q) => q.part === 1).map((q) => q.id)) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check("A5b ids P2 = 7–31", JSON.stringify(exam.QUESTIONS.filter((q) => q.part === 2).map((q) => q.id)) === JSON.stringify(Array.from({ length: 25 }, (_, i) => i + 7)));
check("A5c ids P3 = 32–70", JSON.stringify(exam.QUESTIONS.filter((q) => q.part === 3).map((q) => q.id)) === JSON.stringify(Array.from({ length: 39 }, (_, i) => i + 32)));
check("A5d ids P4 = 71–100", JSON.stringify(exam.QUESTIONS.filter((q) => q.part === 4).map((q) => q.id)) === JSON.stringify(Array.from({ length: 30 }, (_, i) => i + 71)));
check("A6 option keys duy nhất, không bỏ sót, có text", exam.QUESTIONS.every((q) => q.options.length >= 3 && q.options.length <= 4 && new Set(q.options.map((o) => o.key)).size === q.options.length && q.options.every((o) => ["A", "B", "C", "D"].includes(o.key) && typeof o.text === "string" && o.text.length > 0)));

// A7: answerKeyString khớp key đã verify 100/100 (re-parse E từ verify_answers.cjs)
const verifier = read("docs/extracted/verify_answers.cjs");
const mE = verifier.match(/const E = (\{[^}]*\});/);
const EMap = new Function(`return ${mE[1]}`)();
const expectedKey = Object.keys(EMap).map((k) => Number(k)).sort((a, b) => a - b).map((k) => `${k}${EMap[k]}`).join(" ");
check("A7 answerKeyString() khớp đáp án đã verify 100/100", exam.answerKeyString() === expectedKey, exam.answerKeyString().slice(0, 30));
check("A7b answerKeyString có đúng 100 mục", exam.answerKeyString().split(" ").length === 100);

// A8: GROUPS — mọi questionId tồn tại và thuộc đúng Part của group
check("A8 GROUPS: mọi questionId có câu + thuộc đúng part của group",
  exam.GROUPS.every((g) => g.questionIds.every((id) => {
    const q = exam.getQuestionById(id);
    return !!q && q.part === g.part && exam.getGroupForQuestion(q) === g;
  })));
const qidSeen = new Set();
let dup = false;
for (const g of exam.GROUPS) for (const id of g.questionIds) { if (qidSeen.has(id)) dup = true; qidSeen.add(id); }
check("A8b không câu thuộc 2 groups", !dup);
check("A8c mọi câu Part III có group", exam.QUESTIONS.filter((q) => q.part === 3).every((q) => !!q.groupId && qidSeen.has(q.id)));
check("A8d mọi câu Part IV có group", exam.QUESTIONS.filter((q) => q.part === 4).every((q) => !!q.groupId && qidSeen.has(q.id)));
check("A8e câu Part I/II không có group", exam.QUESTIONS.filter((q) => q.part < 3).every((q) => !q.groupId));
check("A8f tổng questionIds của GROUPS == 69", exam.GROUPS.reduce((s, g) => s + g.questionIds.length, 0) === 69);

// A12: cues trong transcript khớp questionIds của group + stripCues không để cue
let cueOk = true, cueInfo = "";
for (const g of exam.GROUPS) {
  const lines = g.transcript.split("\n").map((l) => l.trim()).filter(Boolean);
  const cues = [];
  for (const line of lines) {
    for (const m of line.matchAll(/\(\d{1,3}\)/g)) cues.push(Number(m[0].slice(1, -1)));
    const s = tts.stripCues(line);
    if (/\(\d{1,3}\)/.test(s)) { cueOk = false; cueInfo += ` ${g.id}: leftover "${s}";`; }
  }
  if (JSON.stringify([...cues].sort((a, b) => a - b)) !== JSON.stringify([...g.questionIds].sort((a, b) => a - b))) {
    cueOk = false; cueInfo += ` ${g.id}: cues=[${cues}] questionIds=[${g.questionIds}];`;
  }
}
check("A12 cues trong transcript == questionIds của group; stripCues không để cue", cueOk, cueInfo);

// ---------- B. scoring.ts ----------
const allCorrect = Object.fromEntries(exam.QUESTIONS.map((q) => [q.id, q.answer]));
check("B1 scaledFromRaw(0) === 5", scoring.scaledFromRaw(0) === 5, String(scoring.scaledFromRaw(0)));
check("B2 scaledFromRaw(100) === 495", scoring.scaledFromRaw(100) === 495, String(scoring.scaledFromRaw(100)));
check("B3 scaledFromRaw(50) === 250", scoring.scaledFromRaw(50) === 250, String(scoring.scaledFromRaw(50)));
let mono = true;
for (let r = 0; r <= 100; r++) {
  const v = scoring.scaledFromRaw(r);
  if (v % 5 !== 0 || v < 5 || v > 495) mono = false;
  if (r > 0 && v < scoring.scaledFromRaw(r - 1)) mono = false;
}
check("B5 scaledFromRaw: luôn bội số 5 trong [5,495], tăng dần", mono);
const sAll = scoring.scoreAnswers(allCorrect);
check("B6 allCorrect: raw=100, scaled=495", sAll.raw === 100 && sAll.scaled === 495, `raw=${sAll.raw} scaled=${sAll.scaled}`);
check("B6b perPart tổng=100 và khớp số câu theo Part", sAll.perPart.reduce((a, b) => a + b.correct, 0) === 100 && sAll.perPart.every((p) => p.correct === exam.QUESTIONS.filter((q) => q.part === p.part).length));
const sEmpty = scoring.scoreAnswers({});
check("B7 scoreAnswers({}): raw=0, scaled=5", sEmpty.raw === 0 && sEmpty.scaled === 5, `raw=${sEmpty.raw} scaled=${sEmpty.scaled}`);
const sHalf = scoring.scoreAnswers(Object.fromEntries(exam.QUESTIONS.slice(0, 50).map((q) => [q.id, q.answer])));
check("B8 50 câu đúng đầu tiên: raw=50, scaled=250", sHalf.raw === 50 && sHalf.scaled === 250, `raw=${sHalf.raw} scaled=${sHalf.scaled}`);
check("B9 weakestPart(allCorrect).part === 1 (tie → part nhỏ hơn)", scoring.weakestPart(sAll.perPart).part === 1);
const crafted = [
  { part: 3, correct: 1, total: 39 }, { part: 1, correct: 6, total: 6 }, { part: 2, correct: 25, total: 25 }, { part: 4, correct: 30, total: 30 },
];
check("B10 weakestPart chọn part thấp nhất", scoring.weakestPart(crafted).part === 3, JSON.stringify(scoring.weakestPart(crafted)));
const tie = [
  { part: 3, correct: 13, total: 39 }, { part: 1, correct: 2, total: 6 }, { part: 2, correct: 25, total: 25 }, { part: 4, correct: 30, total: 30 },
];
check("B11 weakestPart tie → part nhỏ hơn", scoring.weakestPart(tie).part === 1, JSON.stringify(tie));

// ---------- C. storage.ts (mock localStorage) ----------
class MockLS {
  constructor() { this.map = new Map(); this.throwKeys = new Set(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { if (this.throwKeys.has(k)) throw new Error("QuotaExceededError"); this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
}
const ls = new MockLS();
globalThis.window = { localStorage: ls, speechSynthesis: null };
check("C1 keys đúng: cdr.draft.v1 / cdr.history.v1 / cdr.mastered.v1",
  storage.DRAFT_KEY === "cdr.draft.v1" && storage.HISTORY_KEY === "cdr.history.v1" && storage.MASTERED_KEY === "cdr.mastered.v1");
check("C2 loadDraft() rỗng → null", storage.loadDraft() === null);
storage.saveDraft({ 1: "A", 2: "D" }, [1]);
const d1 = storage.loadDraft();
check("C3 saveDraft/loadDraft roundtrip", !!d1 && d1.answers[1] === "A" && d1.answers[2] === "D" && Array.isArray(d1.flags) && d1.flags.includes(1) && typeof d1.savedAt === "number");
ls.setItem(storage.DRAFT_KEY, "{not valid json");
check("C4 draft JSON corrupt → loadDraft null (không throw)", storage.loadDraft() === null);
ls.setItem(storage.DRAFT_KEY, '{"flags": "not-array", "answers": {}}');
check("C5 draft flags không phải array → flags=[]", storage.loadDraft()?.flags?.length === 0);
ls.removeItem(storage.DRAFT_KEY);
ls.setItem(storage.HISTORY_KEY, "junk-not-json");
check("C6 history corrupt → loadHistory []", storage.loadHistory().length === 0);
ls.removeItem(storage.HISTORY_KEY);
const a1 = storage.saveAttempt(allCorrect);
const a2 = storage.saveAttempt(Object.assign({}, allCorrect, { 1: "B", 5: "C", 6: "D" }));
check("C7a saveAttempt 2 lần → history.length === 2", storage.loadHistory().length === 2);
check("C7b getAttempt(a2.id).id === a2.id, raw/scaled khớp (roundtrip qua JSON)",
  storage.getAttempt(a2.id)?.id === a2.id && storage.getAttempt(a2.id)?.raw === a2.raw && storage.getAttempt(a2.id)?.scaled === a2.scaled);
check("C7c getPreviousAttempt(a2.id).id === a1.id", storage.getPreviousAttempt(a2.id)?.id === a1.id);
check("C7d getPreviousAttempt(a1.id) === undefined", storage.getPreviousAttempt(a1.id) === undefined);
check("C8a a1.raw === 100", a1.raw === 100);
check("C8b a2.raw === 98", a2.raw === 98, `raw=${a2.raw}`);
const expectedA2Scaled = Math.max(5, Math.round((98 / 100) * 495 / 5) * 5);
check("C8c a2.scaled === quy đổi PRD (raw 98)", a2.scaled === expectedA2Scaled, `scaled=${a2.scaled} expected=${expectedA2Scaled}`);
ls.clear();
let last;
for (let i = 0; i < 55; i++) last = storage.saveAttempt(allCorrect);
check("C9a cap 50: loadHistory.length === 50", storage.loadHistory().length === 50);
check("C9b cap 50: attempt mới nhất vẫn có", storage.getAttempt(last.id) !== undefined);
ls.setItem(storage.DRAFT_KEY, '{"answers":{"1":"A"}}');
storage.clearHistoryAndMastered();
check("C10a clearHistoryAndMastered xoá HISTORY + Mastered", ls.getItem(storage.HISTORY_KEY) === null && ls.getItem(storage.MASTERED_KEY) === null);
check("C10b ...vẫn GIỮ DRAFT", ls.getItem(storage.DRAFT_KEY) !== null);
ls.removeItem(storage.DRAFT_KEY);
check("C11a loadMastered corrupt → {}", Object.keys(storage.loadMastered()).length === 0);
storage.saveMastered({ 3: true, 9: true });
check("C11b saveMastered/loadMastered roundtrip", storage.loadMastered()[3] === true && storage.loadMastered()[9] === true);
storage.toggleMastered(3);
check("C11c toggleMastered(3) bật → bị xóa (đang bật)", storage.loadMastered()[3] === undefined && storage.loadMastered()[9] === true);
storage.toggleMastered(3);
check("C11d toggleMastered(3) lần 2 → bật", storage.loadMastered()[3] === true);
ls.setItem(storage.HISTORY_KEY, JSON.stringify([{ id: "ghost", raw: 10, date: 0, scaled: 50, perPart: [] }]));
const ghost = storage.loadHistory()[0];
check("C12a loadHistory chấp nhận entry thiếu `answers`", ghost?.id === "ghost");
let crashed = false;
try { storage.computeStats(storage.loadHistory()); } catch { crashed = true; }
check("C12b computeStats(entry thiếu answers) THROW — edge nhỏ (data corrupt/tamper)", crashed);
let crashed2 = false;
try { storage.wrongCountByQuestion(storage.loadHistory()); } catch { crashed2 = true; }
check("C12c wrongCountByQuestion(entry thiếu answers) THROW — edge nhỏ", crashed2);
ls.removeItem(storage.HISTORY_KEY);
ls.throwKeys.add(storage.HISTORY_KEY);
const qAttempt = storage.saveAttempt(allCorrect);
check("C13a saveAttempt khi setItem throw → vẫn trả attempt", typeof qAttempt?.id === "string");
check("C13b ...và không lưu", storage.loadHistory().length === 0);
ls.throwKeys.clear();
ls.clear();
const t1 = storage.saveAttempt(Object.assign({}, allCorrect, { 1: "B" }));
const t2 = storage.saveAttempt(Object.assign({}, allCorrect, { 1: "C", 5: "C" }));
const stats = storage.computeStats(storage.loadHistory());
const wcq = storage.wrongCountByQuestion(storage.loadHistory());
check("C14a computeStats.attempts === 2", stats.attempts === 2);
check("C14b bestScaled === t1.scaled", stats.bestScaled === t1.scaled, `best=${stats.bestScaled} t1=${t1.scaled}`);
check("C14c mostMissed === [{id:1,wrong:2},{id:5,wrong:1}]", JSON.stringify(stats.mostMissed) === JSON.stringify([{ id: 1, wrong: 2 }, { id: 5, wrong: 1 }]), JSON.stringify(stats.mostMissed));
check("C14d avgScaled === round((t1.scaled+t2.scaled)/2)", stats.avgScaled === Math.round((t1.scaled + t2.scaled) / 2), `avg=${stats.avgScaled}`);
check("C14e wrongCountByQuestion: 1→2, 5→1", wcq.get(1) === 2 && wcq.get(5) === 1);
check("C14f consistency: mostMissed[0].id === wcq key 1, wrong === 2", stats.mostMissed[0].id === 1 && stats.mostMissed[0].wrong === wcq.get(1));

// ---------- D. tts.ts ----------
class FakeUtter { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; } }
class FakeSynth { constructor() { this.calls = []; } cancel() { this.calls.push("cancel"); } speak(u) { this.calls.push(["speak", u.text, u.rate]); this.last = u; } }
const synth = new FakeSynth();
globalThis.SpeechSynthesisUtterance = FakeUtter;
globalThis.window = { localStorage: ls, speechSynthesis: synth };
check("D1 isTtsSupported() === true (mock)", tts.isTtsSupported() === true);
let stripOk = true, stripInfo = "";
for (const g of exam.GROUPS) {
  for (const line of g.transcript.split("\n")) {
    const s = tts.stripCues(line);
    if (/\(\d{1,3}\)/.test(s)) { stripOk = false; stripInfo += ` ${g.id}: "${line}" -> "${s}";`; }
  }
}
check("D2 stripCues: không còn `\\(n\\)` trong mọi transcript", stripOk, stripInfo);
check("D3 stripCues('a (12) b') === 'a b'", tts.stripCues("a (12) b") === "a b", JSON.stringify(tts.stripCues("a (12) b")));
check("D4 stripCues('(1) start') === 'start'", tts.stripCues("(1) start") === "start", JSON.stringify(tts.stripCues("(1) start")));
check("D5 stripCues('text (5)') === 'text'", tts.stripCues("text (5)") === "text", JSON.stringify(tts.stripCues("text (5)")));
check("D6 stripCues 4-digit '(1234)' không đổi", tts.stripCues("weird (1234) tail") === "weird (1234) tail", JSON.stringify(tts.stripCues("weird (1234) tail")));
check("D7 stripCues('  hello   world  ') → 'hello world'", tts.stripCues("  hello   world  ") === "hello world", JSON.stringify(tts.stripCues("  hello   world  ")));
const q1 = exam.getQuestionById(1), q7 = exam.getQuestionById(7), q32 = exam.getQuestionById(32);
const t1p = tts.speechTextForQuestion(q1);
check("D8 Part I: 'Number 1.' + 4 mệnh đề", t1p.startsWith("Number 1.") && q1.options.every((o) => t1p.includes(o.text)) && ["A", "B", "C", "D"].every((k) => t1p.includes(k)), t1p.slice(0, 70));
const t7 = tts.speechTextForQuestion(q7);
check("D9 Part II: câu hỏi + 3 đáp án", t7.includes(q7.prompt) && q7.options.every((o) => t7.includes(o.text)), t7.slice(0, 70));
const g32 = exam.getGroupById("g32");
check("D10 speechTextForQuestion(q32, g32) === speechTextForGroup(g32)", tts.speechTextForQuestion(q32, g32) === tts.speechTextForGroup(g32));
const t32 = tts.speechTextForGroup(g32);
check("D10b speechTextForGroup(g32): 'Man: Hi Sarah...' + không còn cue", t32.startsWith("Man: Hi Sarah") && !/\(\d{1,3}\)/.test(t32), t32.slice(0, 80));
check("D10c speechTextForGroup(g32) chứa 'Woman: I saw the email, but...'", t32.includes("Woman: I saw the email, but"), t32.slice(0, 160));
const t71 = tts.speechTextForGroup(exam.getGroupById("g71"));
check("D11 speechTextForGroup(g71): không cue + nội dung đúng",
  !/\(\d{1,3}\)/.test(t71) && t71.includes("A massive oil spill on Route 9") && t71.includes("projected to last until noon")
  && t71.includes("Drivers heading toward the financial district should divert onto Expressway 4")
  && t71.includes("Regular updates will be broadcast every fifteen minutes on this station"), t71.slice(0, 80));
synth.calls.length = 0;
tts.speak("hello world", 1);
check("D12 speak → [cancel, speak(text, rate=1)]", JSON.stringify(synth.calls) === JSON.stringify(["cancel", ["speak", "hello world", 1]]), JSON.stringify(synth.calls));
synth.calls.length = 0;
tts.speak("hi", 0.8);
check("D13 speak rate 0.8", JSON.stringify(synth.calls) === JSON.stringify(["cancel", ["speak", "hi", 0.8]]), JSON.stringify(synth.calls));
synth.calls.length = 0;
tts.stopSpeaking();
check("D14 stopSpeaking → [cancel]", JSON.stringify(synth.calls) === JSON.stringify(["cancel"]), JSON.stringify(synth.calls));

console.log(`\n=== verify_review: ${pass} PASS, ${fails.length} FAIL ===`);
if (fails.length) {
  console.log("FAILs:", fails.map((f) => `\n  - ${f}`).join(""));
  process.exitCode = 1;
}
