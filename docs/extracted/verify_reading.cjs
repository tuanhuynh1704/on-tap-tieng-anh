#!/usr/bin/env node
/* eslint-disable */
/**
 * Kiểm tra dữ liệu Reading (src/data/reading.ts) so với nguồn khai thác:
 *  1. ids 1..100, phân bố 30/16/54 theo Part, mỗi câu 4 option A-D
 *  2. đáp án khớp docs/extracted/reading_answer_key.json 100/100
 *  3. câu 31-100 thuộc đúng 1 passage; passage.questionIds khớp range
 *  4. đối chiếu text (chuẩn hoá whitespace): prompt+option của 100 câu với reading_test_raw.md
 *     → báo số khớp; liệt kê các câu không khớp (nếu có)
 *  5. kiểm tra sự hiện diện của các từ khóa tiêu đề/loại tài liệu của từng bộ đoạn
 *  6. Part 6: từng đoạn có đúng 4 chỗ trống {{n}}, blanks == questionIds
 *
 * Chạy: node docs/extracted/verify_reading.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

let createJiti;
try {
  createJiti = require("jiti");
} catch (e) {
  createJiti = require(path.join(ROOT, "node_modules", "jiti"));
}
if (typeof createJiti !== "function") {
  createJiti = createJiti.createJiti || createJiti.default;
}
const jiti = createJiti(__filename, { interopDefault: false });
const {
  READING_QUESTIONS,
  READING_PASSAGES,
  readingPassageBlanks,
  readingPassagePlainText,
} = jiti(path.join(ROOT, "src", "data", "reading.ts"));

const KEY_JSON = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs", "extracted", "reading_answer_key.json"), "utf8")
);
const RAW = fs.readFileSync(path.join(ROOT, "docs", "extracted", "reading_test_raw.md"), "utf8");

// ---------- chuẩn hoá cho so sánh text ----------
function norm(s) {
  return String(s)
    .normalize("NFKC")
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u00A0\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s*[-\u2013\u2014]{3,}\s*/g, " ------ ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- phân tích raw: hàng câu hỏi + hàng options ----------
function clean(s) {
  return String(s).replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u00A0\x00-\x08\x0B\x0C\x0E-\x1F\r\u200E\u200F\u2028\u2029]/g, "");
}
const rawMap = new Map(); // id -> { text, opts: {A..D} }
{
  // Mỗi câu hỏi: dòng bắt đầu bằng "N." → đến dòng câu hỏi tiếp theo bắt đầu "M."
  const segments = [];
  let cur = null;
  for (const rawLine of RAW.split("\n")) {
    const line = clean(rawLine);
    const m = line.match(/^\s*(\d+)\.[ \xA0\t]?/);
    if (m) {
      if (cur) segments.push(cur);
      cur = { id: Number(m[1]), lines: [line] };
      continue;
    }
    if (cur) cur.lines.push(line);
  }
  if (cur) segments.push(cur);
  const extractPairs = (str) => {
    const out = [];
    for (const mm of str.matchAll(/\(([A-D])\)\s*([^\(]*)/g)) out.push([mm[1], mm[2]]);
    return out;
  };
  const isOptLine = (line) => /^\s*(?:\d+\.[ \xA0\t]*)?\(([A-D])\)/.test(line);
  for (const seg of segments) {
    if (rawMap.has(seg.id)) continue; // report (1–4 lặp lại id 1–4) — giữ question đầu tiên
    const opts = {};
    for (const line of seg.lines) {
      if (isOptLine(line)) {
        for (const [k, v] of extractPairs(line)) opts[k] = norm(v);
      }
    }
    // rawText: toàn bộ dòng segment (question + options) — dùng để so substring
    rawMap.set(seg.id, { id: seg.id, text: norm(seg.lines.map((l) => norm(l)).join(" ")), opts });
  }
}

// ---------- kiểm tra dữ liệu ----------
const problems = [];
const warns = [];

// 1-2. id, phân bố, option, đáp án
if (READING_QUESTIONS.length !== 100) problems.push(`số câu = ${READING_QUESTIONS.length}, mong 100`);
const ids = READING_QUESTIONS.map((q) => q.id);
if (ids.some((v, i) => v !== i + 1)) problems.push("ids không là 1..100 theo thứ tự");
const counts = { 5: 0, 6: 0, 7: 0 };
for (const q of READING_QUESTIONS) counts[q.part]++;
if (counts[5] !== 30 || counts[6] !== 16 || counts[7] !== 54)
  problems.push(`phân bố Part sai: ${JSON.stringify(counts)}`);
for (const q of READING_QUESTIONS) {
  if (q.options.length !== 4) problems.push(`Q${q.id}: có ${q.options.length} options`);
  const keys = q.options.map((o) => o.key).sort();
  if (keys.join("") !== "ABCD") problems.push(`Q${q.id}: keys options không phải A-D`);
  if (typeof q.answer !== "string" || !"ABCD".includes(q.answer))
    problems.push(`Q${q.id}: đáp án không hợp lệ: ${q.answer}`);
}
const answerErrors = [];
for (let id = 1; id <= 100; id++) {
  const q = READING_QUESTIONS.find((x) => x.id === id);
  if (!q) {
    answerErrors.push(`Q${id}: thiếu`);
    continue;
  }
  if (q.answer !== KEY_JSON[String(id)]) answerErrors.push(`Q${id}: data=${q.answer} json=${KEY_JSON[String(id)]}`);
}

// 3. câu 31-100 thuộc đúng 1 passage; passage.questionIds khớp
const passageById = new Map(READING_PASSAGES.map((p) => [p.id, p]));
if (READING_PASSAGES.length !== 19) problems.push(`số bộ đoạn = ${READING_PASSAGES.length}, mong 19`);
const qIdsAll = READING_QUESTIONS.map((q) => q.id);
for (const q of READING_QUESTIONS) {
  if (q.part === 6 || q.part === 7) {
    if (q.passageId == null) problems.push(`Q${q.id}: thiếu passageId`);
    else {
      const p = passageById.get(q.passageId);
      if (!p) {
        problems.push(`Q${q.id}: không có passageId ${q.passageId}`);
        continue;
      }
      if (p.questionIds.includes(q.id) === false)
        problems.push(`Q${q.id}: không nằm trong questionIds của passage ${p.id}`);
    }
  } else {
    if (q.passageId !== null) problems.push(`Q${q.id} (Part 5): phải passageId null, có ${q.passageId}`);
  }
}
// tổng số câu Part 7 == 54
const qIds7All = READING_QUESTIONS.filter((q) => q.part === 7).map((q) => q.id);
if (qIds7All.length !== 54) problems.push(`câu Part 7 = ${qIds7All.length}, mong 54`);
const qIds7 = qIds7All;
// Part 6: mỗi đoạn 4 câu + 4 chỗ trống
for (const p of READING_PASSAGES.filter((p) => p.part === 6)) {
  const blanks = readingPassageBlanks(p);
  if (p.documents.length !== 1) problems.push(`passage ${p.id} (P6): có ${p.documents.length} tài liệu`);
  if (p.questionIds.length !== 4 || blanks.length !== 4 || JSON.stringify(blanks) !== JSON.stringify(p.questionIds))
    problems.push(`passage ${p.id} (P6): questionIds=${p.questionIds} blanks=${blanks}`);
}
// Part 7: passage questionIds phần tử riêng biệt, phủ đầy 47..100
const p7 = READING_PASSAGES.filter((p) => p.part === 7).flatMap((p) => p.questionIds);
if (new Set(p7).size !== p7.length) problems.push("duplicated questionIds trong Part 7");
if (p7.length !== 54 || new Set(p7).size !== 54) problems.push(`Part 7 không bao phủ đầy 54 câu`);
for (const id of qIds7) {
  const owners = READING_PASSAGES.filter((p) => p.questionIds.includes(id));
  if (owners.length !== 1) problems.push(`Q${id}: thuộc ${owners.length} passages (mong 1)`);
}

// 5. từ khóa loại tài liệu trong raw
const rawNorm = norm(RAW);
const PASSAGE_KEYWORDS = {
  31: ["advertisement"], 35: ["job advertisement"], 39: ["email"], 43: ["email"], 47: ["email"],
  49: ["messages"], 51: ["advertisement"], 53: ["notice", "reservation"], 56: ["notice"],
  58: ["email"], 61: ["article"], 64: ["advertisement"], 68: ["online chat"], 72: ["article"],
  76: ["schedule", "text message"], 81: ["email", "survey", "report"], 86: ["email", "receipt"],
  91: ["email", "article"], 96: ["notice", "attention, library members"],
};
for (const [idStr, kinds] of Object.entries(PASSAGE_KEYWORDS)) {
  const p = passageById.get(Number(idStr));
  if (!p) continue;
  for (const k of kinds) {
    if (!rawNorm.toLowerCase().includes(norm(k).toLowerCase()))
      warns.push(`passage ${idStr}: raw chưa tìm thấy từ khóa "${k}"`);
  }
}

// 4. so prompt/option của 100 câu với raw
let textMatches = 0;
const textProblems = [];
for (const q of READING_QUESTIONS) {
  const rawQ = rawMap.get(q.id);
  if (!rawQ) {
    textProblems.push(`Q${q.id}: không tìm thấy trong raw`);
    continue;
  }
  if (q.part !== 6 && q.prompt) {
    const dataText = norm(q.prompt);
    if (dataText === "" || rawQ.text.includes(dataText)) textMatches++;
    else textProblems.push(`Q${q.id} prompt not found in raw:\n  data: ${dataText}\n  raw:  ${rawQ.text}`);
  }
  const rawOpts = Object.keys(rawQ.opts).sort().join("");
  if (rawOpts !== "ABCD" && rawOpts !== "") {
    // raw không parse kỹ — chỉ báo
    if (rawOpts) textProblems.push(`Q${q.id}: raw option keys = [${rawOpts}]`);
  }
  for (const o of q.options) {
    const rawO = rawQ.opts[o.key];
    if (rawO === undefined) {
      textProblems.push(`Q${q.id} ${o.key}: raw thiếu option`);
      continue;
    }
    if (norm(o.text) === rawO) textMatches++;
    else textProblems.push(`Q${q.id} ${o.key}: data="${norm(o.text)}" raw="${rawO}"`);
  }
}

// ---------- kết quả ----------
const nRaw = rawMap.size;
console.log("=== verify_reading ===");
console.log(`questions: ${READING_QUESTIONS.length} (ids 1..100: ${ids.every((v, i) => v === i + 1) ? "ok" : "SAI"})`);
console.log(`part counts: P5=${counts[5]} P6=${counts[6]} P7=${counts[7]} ${counts[5] === 30 && counts[6] === 16 && counts[7] === 54 ? "ok" : "SAI"}`);
console.log(`options: 4/4 keys A-D: ${READING_QUESTIONS.every((q) => q.options.length === 4 && q.options.map((o) => o.key).sort().join("") === "ABCD") ? "ok" : "SAI"}`);
console.log(`answers vs answer_key.json: ${answerErrors.length === 0 ? "100/100 ok" : "SAI: " + answerErrors.join("; ")}`);
console.log(`passages: ${READING_PASSAGES.length} (mong 19) ${READING_PASSAGES.length === 19 ? "ok" : "SAI"}`);
console.log(`q31-100 -> passage: ${qIds7.every((id) => {
  const owners = READING_PASSAGES.filter((p) => p.questionIds.includes(id));
  return owners.length === 1;
}) ? "54/54 khớp passage, duy nhất" : "SAI"}`);
const p6 = READING_PASSAGES.filter((p) => p.part === 6);
console.log(`Part 6 blanks: ${p6.length === 4 && p6.every((p) => {
  const blanks = readingPassageBlanks(p);
  return p.documents.length === 1 && JSON.stringify(blanks) === JSON.stringify(p.questionIds) && blanks.length === 4;
}) ? "4 đoạn, blank == questionIds ok" : "SAI (" + p6.length + " đoạn)"}`);
console.log(`raw text compare: ${textMatches} khớp / ${problems.length === 0 ? "" : ""}total entries checked`);
if (textProblems.length) {
  console.log("--- không khớp (mismatches) ---");
  for (const m of textProblems.slice(0, 60)) console.log(m);
  if (textProblems.length > 60) console.log(`... +${textProblems.length - 60} dòng`);
} else console.log("  (no mismatches)");
console.log(`raw question count parsed: ${nRaw}`);
if (warns.length) {
  console.log("--- warns ---");
  for (const w of warns) console.log(w);
}
console.log(`problems: ${problems.length}`);
if (problems.length) for (const p of problems) console.log("  - " + p);
console.log(problems.length === 0 && answerErrors.length === 0 && textProblems.length === 0 ? "RESULT: PASS" : "RESULT: FAIL");
