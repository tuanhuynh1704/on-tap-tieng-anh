// Verify: CTA "Làm Listening" / "Bắt đầu làm bài" must start a fresh attempt
// (clear draft) instead of restoring an old one. Runs against prod on :3211.
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://127.0.0.1:3211";
const LS_KEYS = [
  "cdr.draft.v1",
  "cdr.history.v1",
  "cdr.mastered.v1",
  "cdr.reading.draft.v1",
  "cdr.reading.history.v1",
  "cdr.reading.mastered.v1",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const asserts = [];
function check(name, pass, actual) {
  asserts.push({ name, pass: !!pass, actual });
  return pass;
}

const listeningDraft = { answers: { 1: "A", 2: "B", 3: "C" }, flags: [2], savedAt: Date.now() };
const listeningAttempt = [
  {
    id: "seed-listening",
    date: Date.now(),
    raw: 87,
    scaled: 445,
    perPart: [
      { part: 1, correct: 60, total: 100 },
      { part: 2, correct: 20, total: 50 },
      { part: 3, correct: 7, total: 30 },
      { part: 4, correct: 0, total: 20 },
    ],
    answers: { 1: "A", 2: "B", 3: "C" },
  },
];
const readingDraft = { answers: { 5: "A", 6: "B", 7: "C" }, flags: [], savedAt: Date.now() };
const readingAttempt = [
  {
    id: "seed-reading",
    date: Date.now(),
    raw: 76,
    scaled: 415,
    perPart: [
      { part: 5, correct: 55, total: 55 },
      { part: 6, correct: 20, total: 25 },
      { part: 7, correct: 1, total: 20 },
    ],
    answers: { 5: "A", 6: "B", 7: "C" },
  },
];

// ---------------- prod server on :3211 (mirror docs/extracted/start_prod.mjs) ----------------
const prod = spawn("npm.cmd", ["run", "start", "--", "-p", "3211"], {
  cwd: process.cwd(),
  detached: true,
  stdio: ["ignore", "ignore", "ignore"],
  shell: true,
});
prod.unref();

let prodReady = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(BASE + "/");
    if (r.ok) { prodReady = true; break; }
  } catch {}
  await sleep(500);
}
if (!prodReady) throw new Error("prod server not up on 3211");

const summary = { base: BASE, prodServer: { pid: prod.pid, ready: prodReady }, asserts, consoleByPage: [] };

// ---------------- connect CDP ----------------
const cdp = await CDP.connect();

// ---------------- helpers ----------------
const evalExpr = (expr) => cdp.eval(expr);
const waitForPath = (path) => cdp.waitFor(`new URL(location.href).pathname === ${JSON.stringify(path)}`);
const waitForCount = (n, sel) => cdp.waitFor(`document.querySelectorAll(${JSON.stringify(sel)}).length === ${n}`);
const waitForSelected = (n, sel) => cdp.waitFor(`document.querySelectorAll(${JSON.stringify(sel)}).length === ${n}`);
const lsGet = (key) => evalExpr(`(() => localStorage.getItem(${JSON.stringify(key)}))()`);
const selectedCount = (sel) => evalExpr(`document.querySelectorAll(${JSON.stringify(sel)}).length`);

const SEL_SELECTED = 'section[id^="q-"] button[role="radio"][aria-checked="true"]';
const LS_DRAFT = '"cdr.draft.v1"';

const seedSet = (key, value) => cdp.eval(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))})`);
const draftParsed = () =>
  evalExpr(`(() => { const v = localStorage.getItem(${LS_DRAFT}); return v === null ? null : JSON.parse(v); })()`);
const historyLen = (key) => evalExpr(`(() => { const v = localStorage.getItem(${JSON.stringify(key)}); return v ? JSON.parse(v).length : 0; })()`);
const restoreRaw = (raw) =>
  cdp.eval(
    `(() => { const o = JSON.parse(${JSON.stringify(raw)}); for (const k of Object.keys(o)) { try { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); } catch {} } return true; })()`,
  );

const errorsSoFar = (page) => {
  const out = { page, consoleErrors: [...cdp.consoleErrors], exceptions: [...cdp.exceptions] };
  cdp.consoleErrors.length = 0;
  cdp.exceptions.length = 0;
  return out;
};

// ---------------- 0. save raw localStorage on origin 3211 ----------------
await cdp.navigate(BASE + "/");
const rawBefore = await evalExpr(
  `JSON.stringify((() => { const o = {}; ${LS_KEYS.map((k) => `o[${JSON.stringify(k)}] = localStorage.getItem(${JSON.stringify(k)});`).join("")} return o; })())`,
);
summary.rawBefore = JSON.parse(rawBefore);

// ---------------- 1. Listening hero CTA on "/" ----------------
await cdp.navigate(BASE + "/");
await cdp.waitFor('document.querySelectorAll(\'a[href="/practice"]\').length >= 1');
await sleep(1500);
await seedSet("cdr.draft.v1", listeningDraft);
await seedSet("cdr.history.v1", listeningAttempt);

const t1 = {};
t1.beforeDraft = await draftParsed();
await cdp.eval(`(() => { const els = [...document.querySelectorAll('a[href="/practice"]')].filter((a) => (a.textContent || "").includes("Làm Listening")); if (!els.length) throw new Error("hero link not found"); els[0].click(); return true; })()`);
await waitForPath("/practice");
await waitForCount(100, 'section[id^="q-"]');
t1.draftAfter = await draftParsed();
t1.answersCount = t1.draftAfter ? Object.keys(t1.draftAfter.answers || {}).length : 0;
t1.selectedCount = await selectedCount(SEL_SELECTED);
t1.timerText = await evalExpr('(() => { const el = document.querySelector("span[role=\\"timer\\"]"); return el ? el.textContent : null; })()');
t1.historyLenAfter = await historyLen("cdr.history.v1");
check("listening hero (/): draft cleared (absent or 0 answers)", t1.draftAfter === null || t1.answersCount === 0, t1);
check("listening hero (/): 0 answers selected", t1.selectedCount === 0, t1);
check("listening hero (/): timer ≈ 45:00 / 44:5x", typeof t1.timerText === "string" && /^4[4-5]:[0-9]{2}$/.test(t1.timerText), t1);
check("listening hero (/): history still 1 attempt", t1.historyLenAfter === 1, t1);
summary.test1_listening_hero = t1;
summary.consoleByPage.push(errorsSoFar("/"));

// ---------------- 2. F5 regression on /practice ----------------
const t2 = {};
const click1 = await cdp.eval(
  `(() => { const sec = document.querySelector('section[id="q-1"]'); if (!sec) throw new Error("q-1 missing"); const btns = [...sec.querySelectorAll('button[role="radio"]')]; if (!btns.length) throw new Error("no radios in q-1"); const key = btns[0].querySelector("span") ? btns[0].querySelector("span").textContent : null; btns[0].click(); return { clickedKey: key, radios: btns.length }; })()`,
);
t2.clickedKey = click1 && click1.clickedKey;
await sleep(400);
t2.draftAfterClick = await draftParsed();
await cdp.reload();
await waitForCount(100, 'section[id^="q-"]');
await waitForSelected(1, SEL_SELECTED);
const r2 = await evalExpr(
  `(() => ({ selectedCount: document.querySelectorAll(${JSON.stringify(SEL_SELECTED)}).length, selectedKeys: [...document.querySelectorAll(${JSON.stringify(SEL_SELECTED)})].map((b) => b.querySelector("span") ? b.querySelector("span").textContent : null), draft: (() => { const v = localStorage.getItem(${LS_DRAFT}); return v ? JSON.parse(v) : null; })() }))()`,
);
t2.afterReload = r2;
check("f5 reg: answer of q-1 still selected after reload", r2.selectedCount === 1, r2);
if (t2.clickedKey) {
  check(
    "f5 reg: draft has exactly 1 answer (key \"1\"), answers[\"1\"] === clickedKey",
    r2.draft && Object.keys(r2.draft.answers || {}).length === 1 && r2.draft.answers["1"] === t2.clickedKey,
    r2,
  );
}
check("f5 reg: draft had 1 answer right after click", t2.draftAfterClick && Object.keys(t2.draftAfterClick.answers || {}).length >= 1, t2);
summary.test2_f5_regression = t2;
summary.consoleByPage.push(errorsSoFar("/practice"));

// ---------------- 3. Listening card CTA on "/" (2nd match) ----------------
const t3 = {};
await cdp.navigate(BASE + "/");
await cdp.waitFor('document.querySelectorAll(\'a[href="/practice"]\').length >= 2');
await sleep(1500);
await seedSet("cdr.draft.v1", listeningDraft);
t3.beforeDraft = await draftParsed();
await cdp.eval(`(() => { const els = [...document.querySelectorAll('a[href="/practice"]')].filter((a) => (a.textContent || "").includes("Làm Listening")); if (els.length < 2) throw new Error("card link not found"); els[1].click(); return true; })()`);
await waitForPath("/practice");
await waitForCount(100, 'section[id^="q-"]');
t3.draftAfter = await draftParsed();
t3.answersCount = t3.draftAfter ? Object.keys(t3.draftAfter.answers || {}).length : 0;
t3.selectedCount = await selectedCount(SEL_SELECTED);
t3.timerText = await evalExpr('(() => { const el = document.querySelector("span[role=\\"timer\\"]"); return el ? el.textContent : null; })()');
t3.historyLenAfter = await historyLen("cdr.history.v1");
check("listening card (/): draft cleared (absent or 0 answers)", t3.draftAfter === null || t3.answersCount === 0, t3);
check("listening card (/): 0 answers selected", t3.selectedCount === 0, t3);
check("listening card (/): timer ≈ 45:00 / 44:5x", typeof t3.timerText === "string" && /^4[4-5]:[0-9]{2}$/.test(t3.timerText), t3);
summary.test3_listening_card = t3;
summary.consoleByPage.push(errorsSoFar("/"));

// ---------------- 4. Reading hero CTA on "/reading" ----------------
const t4 = {};
await cdp.navigate(BASE + "/reading");
await cdp.waitFor('document.querySelectorAll(\'a[href="/reading/practice"]\').length >= 1');
await sleep(1500);
await seedSet("cdr.reading.draft.v1", readingDraft);
await seedSet("cdr.reading.history.v1", readingAttempt);
t4.beforeDraft = await draftParsed2();
async function draftParsed2() {
  return evalExpr('(() => { const v = localStorage.getItem("cdr.reading.draft.v1"); return v === null ? null : JSON.parse(v); })()');
}
await cdp.eval('(() => { document.querySelectorAll(\'a[href="/reading/practice"]\')[0].click(); return true; })()');
await waitForPath("/reading/practice");
await waitForCount(100, 'section[id^="q-"]');
t4.draftAfter = await draftParsed2();
t4.answersCount = t4.draftAfter ? Object.keys(t4.draftAfter.answers || {}).length : 0;
t4.selectedCount = await selectedCount(SEL_SELECTED);
t4.historyLenAfter = await historyLen("cdr.reading.history.v1");
check("reading hero (/reading): reading draft cleared (absent or 0 answers)", t4.draftAfter === null || t4.answersCount === 0, t4);
check("reading hero (/reading): 0 answers selected", t4.selectedCount === 0, t4);
check("reading hero (/reading): reading history still 1 attempt", t4.historyLenAfter === 1, t4);
summary.test4_reading_hero = t4;
summary.consoleByPage.push(errorsSoFar("/reading"));

// ---------------- 5. Kill prod server on 3211 ----------------
const kill = { pid: prod.pid, signaled: false, serverDownConfirmed: false, fallbackUsed: false, fallbackPid: null };
const portOpen = async () => {
  try {
    const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
};
if (prod && prod.pid) {
  try {
    process.kill(prod.pid, "SIGTERM");
    kill.signaled = true;
  } catch (err) {
    kill.error = String(err);
  }
  for (let i = 0; i < 20; i++) {
    if (!(await portOpen())) { kill.serverDownConfirmed = true; break; }
    await sleep(300);
  }
  // npm/cmd shell died but the node server grandchild may survive: kill it too via process.kill
  if (!kill.serverDownConfirmed) {
    try {
      const out = execSync(`netstat -ano`, { encoding: "utf8" });
      const row = out
        .split("\n")
        .find((l) => l.trim().startsWith(`0.0.0.0:3211`) || l.trim().startsWith(`[::]:3211`));
      const pidStr = row ? row.trim().split(/\s+/).at(-1) : null;
      if (pidStr) {
        const pid = Number(pidStr);
        kill.fallbackPid = pid;
        try { process.kill(pid, "SIGTERM"); kill.fallbackUsed = true; } catch (err) { kill.fallbackError = String(err); }
      }
    } catch (err) {
      kill.discoveryError = String(err);
    }
    for (let i = 0; i < 20; i++) {
      if (!(await portOpen())) { kill.serverDownConfirmed = true; break; }
      await sleep(300);
    }
  }
}
summary.kill = kill;

// ---------------- 6. Restore localStorage ----------------
let restored = false;
try {
  await restoreRaw(rawBefore);
  restored = true;
} catch (err) {
  summary.restoreError = String(err);
}
summary.restore = { rawBefore, restored };

cdp.close();

summary.allAssertsPass = asserts.every((a) => a.pass);

fs.writeFileSync("docs/extracted/verify_fresh_start.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
