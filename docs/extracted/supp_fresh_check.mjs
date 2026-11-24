// Supplementary independent check for fresh-start CTA fix.
// Verifies flags are cleared too, plus second-entry and F5 regression.
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://127.0.0.1:3213";
const KEYS = [
  "cdr.draft.v1",
  "cdr.history.v1",
  "cdr.mastered.v1",
  "cdr.reading.draft.v1",
  "cdr.reading.history.v1",
  "cdr.reading.mastered.v1",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SEL_SELECTED = 'section[id^="q-"] button[role="radio"][aria-checked="true"]';
const SEL_FLAGGED = 'section[id^="q-"] button[aria-label^="Bỏ đánh dấu"]';
const SEL_CARDS = 'section[id^="q-"]';
const SEL_TIMER = 'span[role="timer"]';

const asserts = [];
function check(name, pass, actual) {
  asserts.push({ name, pass: !!pass, actual });
  return !!pass;
}

const listeningDraft = { answers: { 1: "A", 2: "B", 3: "C", 4: "D" }, flags: [2, 4], savedAt: Date.now() };
const listeningHistory = [
  {
    id: "seed-listening-supp",
    date: Date.now(),
    raw: 50,
    scaled: 250,
    perPart: [
      { part: 1, correct: 3, total: 6 },
      { part: 2, correct: 10, total: 25 },
      { part: 3, correct: 20, total: 39 },
      { part: 4, correct: 17, total: 30 },
    ],
    answers: {},
  },
];
const readingDraft = { answers: { 5: "A", 6: "B", 7: "C" }, flags: [5, 6], savedAt: Date.now() };
const readingHistory = [
  {
    id: "seed-reading-supp",
    date: Date.now(),
    raw: 40,
    scaled: 200,
    perPart: [
      { part: 5, correct: 12, total: 30 },
      { part: 6, correct: 8, total: 16 },
      { part: 7, correct: 20, total: 54 },
    ],
    answers: {},
  },
];

// --- prod server on :3213 ---
const prod = spawn("npm.cmd", ["run", "start", "--", "-p", "3213"], {
  cwd: process.cwd(),
  detached: true,
  stdio: ["ignore", "ignore", "ignore"],
  shell: true,
});
prod.unref();
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(BASE + "/");
    if (r.ok) { ready = true; break; }
  } catch {}
  await sleep(500);
}
if (!ready) throw new Error("prod server not up on 3213");

const cdp = await CDP.connect();
await cdp.setViewport(1440, 900, false);
const out = { base: BASE, prodPid: prod.pid, asserts, consoleByPage: [], startedAt: new Date().toISOString() };

const evalx = (expr) => cdp.eval(expr);
const seed = (key, value) => evalx(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))})`);
const rawGet = (key) => evalx(`localStorage.getItem(${JSON.stringify(key)})`);
const draftOf = (key) => evalx(`(()=>{const v=localStorage.getItem(${JSON.stringify(key)});return v===null?null:JSON.parse(v)})()`);
const histLen = (key) => evalx(`(()=>{const v=localStorage.getItem(${JSON.stringify(key)});if(!v)return 0;const a=JSON.parse(v);return Array.isArray(a)?a.length:-1})()`);
const takeConsole = (page) => {
  const row = { page, errors: [...cdp.consoleErrors], exceptions: [...cdp.exceptions] };
  cdp.consoleErrors.length = 0;
  cdp.exceptions.length = 0;
  out.consoleByPage.push(row);
  return row;
};
async function goto(url) {
  cdp.consoleErrors.length = 0;
  cdp.exceptions.length = 0;
  await cdp.navigate(BASE + url);
  await cdp.waitFor('document.readyState === "complete"');
}
async function waitPractice(path, sections) {
  await cdp.waitFor(`new URL(location.href).pathname === ${JSON.stringify(path)}`, 45000);
  await cdp.waitFor(`document.querySelectorAll(${JSON.stringify(SEL_CARDS)}).length === ${sections}`, 45000);
  await sleep(500);
}
const snapshot = async (draftKey) => ({
  selected: await evalx(`document.querySelectorAll(${JSON.stringify(SEL_SELECTED)}).length`),
  flagged: await evalx(`document.querySelectorAll(${JSON.stringify(SEL_FLAGGED)}).length`),
  timer: await evalx(`(()=>{const e=document.querySelector(${JSON.stringify(SEL_TIMER)});return e?e.textContent:null})()`),
  draft: await draftOf(draftKey),
  draftAnswers: await evalx(`(()=>{const v=localStorage.getItem(${JSON.stringify(draftKey)});if(!v)return 0;const d=JSON.parse(v);return Object.keys(d.answers||{}).length})()`),
  historyLen: await histLen(draftKey === "cdr.draft.v1" ? "cdr.history.v1" : "cdr.reading.history.v1"),
});

// 0. backup raw localStorage
await goto("/");
const rawBefore = {};
for (const k of KEYS) rawBefore[k] = await rawGet(k);
out.rawBefore = rawBefore;

// 1. Listening hero: seed old draft (4 answers + 2 flags) -> click -> 0/0
await goto("/");
await cdp.waitFor(`[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening")).length >= 1`);
await sleep(1500);
await seed("cdr.draft.v1", listeningDraft);
await seed("cdr.history.v1", listeningHistory);
out.seededListening = { draft: await draftOf("cdr.draft.v1"), historyLen: await histLen("cdr.history.v1") };
await evalx(`(()=>{const els=[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening"));if(!els[0])throw new Error("hero missing");els[0].click();return true})()`);
await waitPractice("/practice", 100);
const a = await snapshot("cdr.draft.v1");
out.A_hero = a;
check("A hero: 0 answers selected", a.selected === 0, a);
check("A hero: 0 flags on", a.flagged === 0, a);
check("A hero: timer 45:00/44:5x", typeof a.timer === "string" && /^4[4-5]:[0-9]{2}$/.test(a.timer), a);
check("A hero: draft has 0 answers", a.draft === null || a.draftAnswers === 0, a);
check("A hero: listening history still 1", a.historyLen === 1, a);
takeConsole("/");

// 2. Click one answer + one flag, then go home, seed again, click card -> 0/0
await evalx(`(()=>{const s=document.querySelector('section[id="q-1"]');const b=s.querySelector('button[role="radio"]');b.click();const f=s.querySelector('button[aria-label^="Đánh dấu"]');f.click();return true})()`);
await sleep(500);
out.beforeLeaving = { selected: await evalx(`document.querySelectorAll(${JSON.stringify(SEL_SELECTED)}).length`), flagged: await evalx(`document.querySelectorAll(${JSON.stringify(SEL_FLAGGED)}).length`), draft: await draftOf("cdr.draft.v1") };
await goto("/");
await cdp.waitFor(`[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening")).length >= 2`);
await sleep(1500);
await seed("cdr.draft.v1", listeningDraft);
await evalx(`(()=>{const els=[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening"));if(!els[1])throw new Error("card missing");els[1].click();return true})()`);
await waitPractice("/practice", 100);
const b = await snapshot("cdr.draft.v1");
out.B_card = b;
check("B card: 0 answers selected", b.selected === 0, b);
check("B card: 0 flags on", b.flagged === 0, b);
check("B card: draft has 0 answers", b.draft === null || b.draftAnswers === 0, b);
check("B card: listening history still 1", b.historyLen === 1, b);
takeConsole("/");

// 3. F5 regression: answer q1 -> reload -> still selected
await evalx(`(()=>{const s=document.querySelector('section[id="q-1"]');s.querySelector('button[role="radio"]').click();return true})()`);
await sleep(500);
out.C_beforeReload = await draftOf("cdr.draft.v1");
await cdp.reload();
await waitPractice("/practice", 100);
const c = await snapshot("cdr.draft.v1");
out.C_afterReload = c;
check("C F5: q1 still selected", c.selected === 1, c);
check("C F5: draft answers[\"1\"] present", !!c.draft && Object.keys(c.draft.answers || {}).length === 1 && !!c.draft.answers["1"], c);
takeConsole("/practice");

// 4. Reading hub: seed old reading draft (3 answers + 2 flags) -> start -> 0/0
await goto("/reading");
await cdp.waitFor(`document.querySelectorAll('a[href="/reading/practice"]').length >= 1`);
await sleep(1500);
await seed("cdr.reading.draft.v1", readingDraft);
await seed("cdr.reading.history.v1", readingHistory);
out.seededReading = { draft: await draftOf("cdr.reading.draft.v1"), historyLen: await histLen("cdr.reading.history.v1") };
await evalx(`(()=>{document.querySelectorAll('a[href="/reading/practice"]')[0].click();return true})()`);
await waitPractice("/reading/practice", 100);
const d = await snapshot("cdr.reading.draft.v1");
out.D_reading = d;
check("D reading: 0 answers selected", d.selected === 0, d);
check("D reading: 0 flags on", d.flagged === 0, d);
check("D reading: timer 75:00/74:5x", typeof d.timer === "string" && /^7[4-5]:[0-9]{2}$/.test(d.timer), d);
check("D reading: reading draft has 0 answers", d.draft === null || d.draftAnswers === 0, d);
check("D reading: reading history still 1", d.historyLen === 1, d);
takeConsole("/reading");

// 5. cleanup: restore localStorage, kill :3213
const restore = { restored: false };
try {
  for (const k of KEYS) {
    const v = rawBefore[k];
    await evalx(v === null ? `localStorage.removeItem(${JSON.stringify(k)})` : `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  }
  restore.restored = true;
} catch (e) {
  restore.error = String(e);
}
out.restore = restore;

const kill = { signaled: false, portClosed: false, fallbackPid: null };
try { process.kill(prod.pid, "SIGTERM"); kill.signaled = true; } catch (e) { kill.error = String(e); }
const portOpen = async () => {
  try { const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(2500) }); return r.ok; } catch { return false; }
};
for (let i = 0; i < 20; i++) { if (!(await portOpen())) { kill.portClosed = true; break; } await sleep(300); }
if (!kill.portClosed) {
  try {
    const rows = execSync("netstat -ano", { encoding: "utf8" }).split("\n").filter((l) => /[:.]3213\s/.test(l) && /LISTENING/.test(l));
    for (const row of rows) {
      const pid = Number(row.trim().split(/\s+/).at(-1));
      if (pid) { kill.fallbackPid = pid; try { process.kill(pid, "SIGTERM"); } catch {} }
    }
  } catch (e) { kill.discoveryError = String(e); }
  for (let i = 0; i < 20; i++) { if (!(await portOpen())) { kill.portClosed = true; break; } await sleep(300); }
}
out.kill = kill;
cdp.close();

out.allPass = asserts.every((x) => x.pass);
out.finishedAt = new Date().toISOString();
fs.writeFileSync("docs/extracted/supp_fresh_check.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ allPass: out.allPass, asserts: asserts.map((x) => ({ pass: x.pass, name: x.name })), console: out.consoleByPage.map((c) => ({ page: c.page, e: c.errors.length, x: c.exceptions.length })), kill, restore }, null, 2));
