// Kiểm chứng luồng "CTA bắt đầu lượt mới": hero "Làm Listening →" (/practice) và "Bắt đầu làm bài →"
// (/reading/practice) khi Activity của Next giữ state/DOM cũ (next.config.ts: cacheComponents) phải
// reset draft + state, không restore đáp án cũ. Dùng prod trên :3215. Ghi docs/extracted/verify_fresh_activity.json + stdout.
// Tái sử dụng: cdp.mjs; tham khảo repro_submit_flow.mjs (flow) và launch_chrome.mjs (khởi chrome).
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://127.0.0.1:3215";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CHROME_ARGS = [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--user-data-dir=C:\\Users\\nkocn\\AppData\\Local\\Temp\\opencode\\cdp-chrome3",
  "about:blank",
];
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
const summary = { base: BASE, asserts };

// ---------------- prod server on :3215 ----------------
const prod = spawn("npm.cmd", ["run", "start", "--", "-p", "3215"], {
  detached: true,
  stdio: ["ignore", "ignore", "ignore"],
  shell: true,
});
prod.unref();
const portOpen = async () => {
  try {
    const r = await fetch(BASE + "/");
    return r.ok;
  } catch {
    return false;
  }
};
let prodReady = false;
for (let i = 0; i < 60; i++) {
  if (await portOpen()) { prodReady = true; break; }
  await sleep(500);
}
if (!prodReady) throw new Error("prod server not up on 3215");
summary.prodServer = { pid: prod.pid, ready: prodReady };

// ---------------- chrome (theo launch_chrome.mjs) ----------------
async function ensureChrome() {
  try {
    const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
    if (list.some((t) => t.type === "page")) return;
  } catch {}
  const child = spawn(CHROME, CHROME_ARGS, { detached: true, stdio: "ignore" });
  child.unref();
  for (let i = 0; i < 20; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
      if (list.some((t) => t.type === "page")) return;
    } catch {}
    await sleep(300);
  }
  throw new Error("chrome did not start");
}
await ensureChrome();

// ---------------- connect CDP ----------------
const cdp = await CDP.connect();
const evalExpr = (expr) => cdp.eval(expr);
const waitPath = (path) => cdp.waitFor(`new URL(location.href).pathname === ${JSON.stringify(path)}`);
const clickSel = (sel) =>
  evalExpr(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error("missing: " + ${JSON.stringify(sel)}); el.click(); return true; })()`);
const clickTextIn = (text, rootSel) =>
  evalExpr(`(() => {
    const roots = ${rootSel === undefined ? "[document]" : `document.querySelectorAll(${JSON.stringify(rootSel)})`};
    let el = null;
    for (const root of roots) {
      const all = root.tagName ? [root, ...root.querySelectorAll("a, button")] : [...root.querySelectorAll("a, button")];
      el = all.find((e) => (e.textContent || "").trim() === ${JSON.stringify(text)}) || all.find((e) => (e.textContent || "").includes(${JSON.stringify(text)}));
      if (el) break;
    }
    if (!el) throw new Error("not found: " + ${JSON.stringify(text)});
    el.click(); return true;
  })()`);
const historyLen = (key) => evalExpr(`(() => { const v = localStorage.getItem(${JSON.stringify(key)}); return v ? JSON.parse(v).length : 0; })()`);
const draftParsed = (key = "cdr.draft.v1") =>
  evalExpr(`(() => { const v = localStorage.getItem(${JSON.stringify(key)}); return v === null ? null : JSON.parse(v); })()`);
const draftEmpty = (draft) =>
  !draft || (Object.keys(draft.answers || {}).length === 0 && (draft.flags || []).length === 0);
// Phần tử ĐANG HIỂN THỊ (Activity giữ DOM ẩn) — theo cách quy định.
const VISIBLE = "[...document.querySelectorAll('section[id^=\"q-\"]')].filter((el) => el.getClientRects().length > 0)";
const counts = () =>
  evalExpr(`(() => {
    const secs = ${VISIBLE};
    return {
      visible: secs.length,
      selected: secs.filter((s) => s.querySelector('button[role="radio"][aria-checked="true"]')).length,
      flagged: secs.filter((s) => s.querySelector('button[aria-pressed="true"]')).length,
      timer: (document.querySelector('span[role="timer"]') || {}).textContent || null,
    };
  })()`);
const selectedIds = () =>
  evalExpr(`${VISIBLE}.filter((s) => s.querySelector('button[role="radio"][aria-checked="true"]')).map((s) => s.id)`);
const timerOk = (t) => {
  if (!t) return false;
  const m = /^(\d+):(\d{2})$/.exec(t);
  if (!m) return false;
  const sec = Number(m[1]) * 60 + Number(m[2]);
  return (sec >= 45 * 60 && sec <= 45 * 60 + 9) || (sec >= 44 * 60 + 50 && sec <= 44 * 60 + 59); // 44:50–45:09
};
const timerReadingOk = (t) => {
  if (!t) return false;
  const m = /^(\d+):(\d{2})$/.exec(t);
  if (!m) return false;
  const sec = Number(m[1]) * 60 + Number(m[2]);
  return sec >= 74 * 60 + 50 && sec <= 75 * 60 + 9; // 74:50–75:09 (giá trị từ 75:00 tốc độ tối thiểu)
};
const wait100 = () => cdp.waitFor(`document.querySelectorAll('section[id^="q-"]').length === 100`);

// backup localStorage (6 keys) trước khi test
const rawBefore = await evalExpr(
  `JSON.stringify((() => { const o = {}; ${LS_KEYS.map((k) => `o[${JSON.stringify(k)}] = localStorage.getItem(${JSON.stringify(k)});`).join("")} return o; })())`,
);
summary.rawBefore = JSON.parse(rawBefore);
// Xoá state cũ để test deterministic (restore cuối run về trạng thái ban đầu).
await evalExpr(`(() => { for (const k of ${JSON.stringify(LS_KEYS)}) { try { localStorage.removeItem(k); } catch {} } return true; })()`);

const consoleByPage = [];
function checkConsole(route) {
  consoleByPage.push({
    route,
    consoleErrors: [...cdp.consoleErrors],
    exceptions: [...cdp.exceptions],
  });
  cdp.consoleErrors.length = 0;
  cdp.exceptions.length = 0;
}

// ==================== A. Luồng Founder (Listening) ====================
const tA = {};
await cdp.navigate(BASE + "/practice");
await wait100();
await sleep(600);
tA.countsAtStart = await counts();
await clickSel('section[id="q-1"] button[role="radio"]');
await sleep(400);
await clickSel('section[id="q-2"] button[title="Đánh dấu để xem lại"], section[id="q-2"] button[title="Bỏ đánh dấu"]');
await sleep(300);
tA.historyBeforeSubmit = await historyLen("cdr.history.v1");
await clickTextIn("Nộp bài", "header");
await cdp.waitFor(`document.querySelector('div[role="dialog"]') !== null`);
await clickTextIn("Nộp bài", 'div[role="dialog"]');
await waitPath("/results");
await sleep(1000);
await clickSel('a[href="/"]');
await waitPath("/");
await sleep(600);
await clickTextIn("Làm Listening →", "a");
await waitPath("/practice");
await wait100();
await sleep(900);
tA.afterCta = await counts();
tA.draft = await draftParsed("cdr.draft.v1");
tA.historyAfter = await historyLen("cdr.history.v1");
check("A: visible selected = 0 sau CTA hero", tA.afterCta.selected === 0, tA);
check("A: visible flagged = 0 sau CTA hero", tA.afterCta.flagged === 0, tA);
check("A: timer ≈ 45:00/44:5x sau CTA hero", timerOk(tA.afterCta.timer), tA);
check("A: draft rỗng hoặc không có", draftEmpty(tA.draft), tA);
check("A: history tăng đúng 1 so với trước nộp", tA.historyAfter === tA.historyBeforeSubmit + 1, tA);
summary.testA_founder_flow = tA;

// ==================== B. Làm dở chưa nộp ====================
const tB = {};
await cdp.navigate(BASE + "/practice");
await wait100();
await sleep(600);
await clickSel('section[id="q-1"] button[role="radio"]');
await sleep(400);
await clickSel('section[id="q-1"] button[title="Đánh dấu để xem lại"], section[id="q-1"] button[title="Bỏ đánh dấu"]');
await sleep(300);
await clickSel('a[href="/"]');
await waitPath("/");
await sleep(700);
await clickTextIn("Làm Listening →", "a");
await waitPath("/practice");
await wait100();
await sleep(900);
tB.afterCta = await counts();
tB.draft = await draftParsed("cdr.draft.v1");
check("B: selected = 0", tB.afterCta.selected === 0, tB);
check("B: flagged = 0", tB.afterCta.flagged === 0, tB);
check("B: timer ≈ 45:00/44:5x", timerOk(tB.afterCta.timer), tB);
check("B: draft rỗng hoặc không có", draftEmpty(tB.draft), tB);
summary.testB_draft_abandoned = tB;

// ==================== C. Resume không hồi quy ====================
const tC = {};
await cdp.navigate(BASE + "/practice");
await wait100();
await sleep(600);
await clickSel('section[id="q-1"] button[role="radio"]');
await sleep(400);
await clickSel('a[href="/"]');
await waitPath("/");
await sleep(700);
await clickSel('nav a[href="/practice"]');
await waitPath("/practice");
await sleep(1000);
tC.counts = await counts();
tC.draft = await draftParsed("cdr.draft.v1");
check("C: câu 1 vẫn được chọn (resume qua nav)", tC.counts.selected === 1, tC);
check("C: draft có câu 1", !!tC.draft && Object.keys(tC.draft.answers || {}).includes("1"), tC);
summary.testC_resume_valid = tC;

// ==================== D. F5 không hồi quy ====================
const tD = {};
await clickSel('section[id="q-3"] button[role="radio"]');
await sleep(500);
await cdp.reload();
await sleep(1000);
tD.selectedIds = await selectedIds();
tD.counts = await counts();
check("D: F5 giữ câu 3 đã chọn", tD.selectedIds.includes("q-3"), tD);
summary.testD_f5_resume = tD;

// ==================== E. Reading ====================
const tE = {};
await cdp.navigate(BASE + "/reading/practice");
await wait100();
await sleep(700);
await clickSel('section[id="q-5"] button[role="radio"]');
await sleep(400);
await clickSel('section[id="q-6"] button[aria-label^="Đánh dấu"], section[id="q-6"] button[aria-label^="Bỏ đánh dấu"]');
await sleep(300);
tE.readingHistoryBeforeSubmit = await historyLen("cdr.reading.history.v1");
await clickTextIn("Nộp bài", "header");
await cdp.waitFor(`document.querySelector('div[role="dialog"]') !== null`);
await clickTextIn("Nộp bài", 'div[role="dialog"]');
await waitPath("/reading/results");
await sleep(1000);
await clickSel('nav a[href="/reading"]');
await waitPath("/reading");
await sleep(700);
await clickTextIn("Bắt đầu làm bài →", "a");
await waitPath("/reading/practice");
await sleep(1000);
tE.afterCta = await counts();
tE.draft = await draftParsed("cdr.reading.draft.v1");
tE.readingHistoryAfter = await historyLen("cdr.reading.history.v1");
check("E: visible selected = 0", tE.afterCta.selected === 0, tE);
check("E: visible flagged = 0", tE.afterCta.flagged === 0, tE);
check("E: timer ≈ 75:00–75:09", timerReadingOk(tE.afterCta.timer), tE);
check("E: reading draft rỗng hoặc không có", draftEmpty(tE.draft), tE);
check("E: reading history tăng đúng 1", tE.readingHistoryAfter === tE.readingHistoryBeforeSubmit + 1, tE);
summary.testE_reading_flow = tE;

// ==================== F. Console per page ====================
await cdp.navigate(BASE + "/"); checkConsole("/");
await cdp.navigate(BASE + "/practice"); checkConsole("/practice");
await cdp.navigate(BASE + "/results"); checkConsole("/results");
await cdp.navigate(BASE + "/reading"); checkConsole("/reading");
await cdp.navigate(BASE + "/reading/practice"); checkConsole("/reading/practice");
await cdp.navigate(BASE + "/reading/results"); checkConsole("/reading/results");
summary.consoleByPage = consoleByPage;
summary.allConsoleOk = consoleByPage.every((c) => c.consoleErrors.length === 0 && c.exceptions.length === 0);

// ---------------- restore localStorage ----------------
let restoreError = null;
try {
  await evalExpr(`(() => { const o = JSON.parse(${JSON.stringify(rawBefore)}); for (const k of Object.keys(o)) { try { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); } catch {} } return true; })()`);
} catch (err) {
  restoreError = String(err);
}
summary.restore = { restored: !restoreError, error: restoreError };

// ---------------- kill prod server on 3215 ----------------
const portOpen2 = async () => {
  try { const r = await fetch(BASE + "/"); return r.ok; } catch { return false; }
};
if (prod && prod.pid) {
  try { process.kill(prod.pid, "SIGTERM"); summary.killSignaled = true; } catch {}
  let down = false;
  for (let i = 0; i < 30; i++) { if (!(await portOpen2())) { down = true; break; } await sleep(300); }
  summary.serverDownConfirmed = down;
  // npm/cmd shell đã chết nhưng nhóm node server có thể vẫn sống — tìm qua netstat và dừng.
  if (!down) {
    try {
      const out = execSync("netstat -ano", { encoding: "utf8" });
      const row = out.split("\n").find((l) => l.includes(":3215") && l.includes("LISTENING"));
      const pidStr = row ? row.trim().split(/\s+/).at(-1) : null;
      if (pidStr) {
        summary.killFallbackPid = Number(pidStr);
        try { process.kill(summary.killFallbackPid, "SIGTERM"); } catch {}
      }
    } catch {}
    for (let i = 0; i < 30; i++) { if (!(await portOpen2())) { summary.serverDownConfirmed = true; break; } await sleep(300); }
  }
}
cdp.close();
summary.allAssertsPass = asserts.every((a) => a.pass);

fs.writeFileSync("docs/extracted/verify_fresh_activity.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
