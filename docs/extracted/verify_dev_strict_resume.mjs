// Dev StrictMode regression: resume via header, flags, F5, mid-attempt CTA, Reading.
// Run against the running dev server (:3000), separate CDP Chrome profile.
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://localhost:3000";
const KEYS = [
  "cdr.draft.v1",
  "cdr.history.v1",
  "cdr.mastered.v1",
  "cdr.reading.draft.v1",
  "cdr.reading.history.v1",
  "cdr.reading.mastered.v1",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VISIBLE = `[...document.querySelectorAll('section[id^="q-"]')].filter((el) => el.getClientRects().length > 0)`;
const out = { base: BASE, asserts: [], consoleByPage: [] };
function check(name, pass, actual) {
  out.asserts.push({ name, pass: !!pass, actual });
  return !!pass;
}

const cdp = await CDP.connect();
await cdp.setViewport(1440, 900, false);
const evalx = (expr) => cdp.eval(expr);
const raw = {};
await cdp.navigate(BASE + "/");
await cdp.waitFor(`location.origin === "http://localhost:3000" && document.readyState === "complete"`, 45000);
await sleep(500);
for (const k of KEYS) raw[k] = await evalx(`localStorage.getItem(${JSON.stringify(k)})`);
await evalx(`(() => { for (const k of ${JSON.stringify(KEYS)}) localStorage.removeItem(k); return true; })()`);

const counts = () =>
  evalx(`(() => {
    const secs = ${VISIBLE};
    return {
      visible: secs.length,
      selected: secs.filter((s) => s.querySelector('button[role="radio"][aria-checked="true"]')).length,
      flagged: secs.filter((s) => s.querySelector('button[aria-pressed="true"]')).length,
      selectedIds: secs.filter((s) => s.querySelector('button[role="radio"][aria-checked="true"]')).map((s) => s.id),
      flaggedIds: secs.filter((s) => s.querySelector('button[aria-pressed="true"]')).map((s) => s.id),
      timer: (document.querySelector('span[role="timer"]') || {}).textContent || null,
    };
  })()`);
const draftOf = (key) => evalx(`(() => { const v = localStorage.getItem(${JSON.stringify(key)}); return v === null ? null : JSON.parse(v); })()`);
const clickVisible = (sel) =>
  evalx(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => e.getClientRects().length > 0);
    if (!el) throw new Error("missing visible: " + ${JSON.stringify(sel)});
    el.click();
    return true;
  })()`);
const clickListeningCta = (index) =>
  evalx(`(() => {
    const els = [...document.querySelectorAll('a[href="/practice"]')].filter(
      (e) => e.getClientRects().length > 0 && (e.textContent || "").includes("Làm Listening")
    );
    const el = els[${index}];
    if (!el) throw new Error("missing Làm Listening CTA index " + ${index});
    el.click();
    return true;
  })()`);
const waitPath = (p) => cdp.waitFor(`new URL(location.href).pathname === ${JSON.stringify(p)}`, 45000);
const waitPractice = async (p) => {
  await waitPath(p);
  await cdp.waitFor(`document.querySelectorAll('section[id^="q-"]').length === 100`, 60000);
  await sleep(600);
};
const timerSec = (t) => {
  const m = /^(\d+):(\d{2})$/.exec(t || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};
const takeConsole = (page) => {
  out.consoleByPage.push({ page, errors: [...cdp.consoleErrors], exceptions: [...cdp.exceptions] });
  cdp.consoleErrors.length = 0;
  cdp.exceptions.length = 0;
};

// 1. Fresh load: empty
await cdp.navigate(BASE + "/practice");
await waitPractice("/practice");
out.fresh = await counts();
check("dev fresh: 0 selected", out.fresh.selected === 0, out.fresh);
check("dev fresh: 0 flagged", out.fresh.flagged === 0, out.fresh);
check("dev fresh: timer 45:00", out.fresh.timer === "45:00", out.fresh);
check("dev fresh: no draft", (await draftOf("cdr.draft.v1")) === null, await draftOf("cdr.draft.v1"));
takeConsole("/practice");

// 2. Answer q1 -> draft saved
await clickVisible('section[id="q-1"] button[role="radio"]');
await sleep(600);
out.afterAnswer = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev answer: q1 selected", out.afterAnswer.counts.selected === 1, out.afterAnswer);
check("dev answer: draft has q1", !!out.afterAnswer.draft && Object.keys(out.afterAnswer.draft.answers || {}).includes("1"), out.afterAnswer);

// 3. Resume via header nav (Activity show)
await clickVisible('a[href="/"]');
await waitPath("/");
await sleep(500);
await clickVisible('nav a[href="/practice"]');
await waitPractice("/practice");
out.resume = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev resume: q1 still selected", out.resume.counts.selectedIds.includes("q-1"), out.resume);
check("dev resume: timer kept (~44:5x)", timerSec(out.resume.counts.timer) >= 44 * 60 + 50, out.resume);
check("dev resume: draft has q1", !!out.resume.draft && Object.keys(out.resume.draft.answers || {}).includes("1"), out.resume);
takeConsole("/");

// 4. Flag q2 -> resume with flag
await clickVisible('section[id="q-2"] button[aria-label^="Đánh dấu"]');
await sleep(600);
await clickVisible('a[href="/"]');
await waitPath("/");
await sleep(500);
await clickVisible('nav a[href="/practice"]');
await waitPractice("/practice");
out.resumeFlag = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev resume flag: q1 selected", out.resumeFlag.counts.selectedIds.includes("q-1"), out.resumeFlag);
check("dev resume flag: q2 flagged", out.resumeFlag.counts.flaggedIds.includes("q-2"), out.resumeFlag);
check("dev resume flag: draft flags has 2", !!out.resumeFlag.draft && (out.resumeFlag.draft.flags || []).includes(2), out.resumeFlag);
takeConsole("/practice");

// 5. F5 keeps answers + flags
await cdp.reload();
await waitPractice("/practice");
out.f5 = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev F5: q1 selected", out.f5.counts.selectedIds.includes("q-1"), out.f5);
check("dev F5: q2 flagged", out.f5.counts.flaggedIds.includes("q-2"), out.f5);
check("dev F5: draft has q1 + flag 2", !!out.f5.draft && Object.keys(out.f5.draft.answers || {}).includes("1") && (out.f5.draft.flags || []).includes(2), out.f5);
takeConsole("/practice");

// 6a. Mid-attempt hero CTA -> fresh
await clickVisible('a[href="/"]');
await waitPath("/");
await sleep(500);
await clickListeningCta(0);
await waitPractice("/practice");
out.midCta = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev mid CTA hero: 0 selected", out.midCta.counts.selected === 0, out.midCta);
check("dev mid CTA hero: 0 flagged", out.midCta.counts.flagged === 0, out.midCta);
check("dev mid CTA hero: timer 45:00/44:5x", timerSec(out.midCta.counts.timer) >= 44 * 60 + 50, out.midCta);
check("dev mid CTA hero: draft empty/absent", !out.midCta.draft || (Object.keys(out.midCta.draft.answers || {}).length === 0 && (out.midCta.draft.flags || []).length === 0), out.midCta);
takeConsole("/");

// 6b. Mid-attempt card CTA -> fresh
await clickVisible('section[id="q-1"] button[role="radio"]');
await sleep(600);
await clickVisible('a[href="/"]');
await waitPath("/");
await sleep(500);
await clickListeningCta(1);
await waitPractice("/practice");
out.midCtaCard = { counts: await counts(), draft: await draftOf("cdr.draft.v1") };
check("dev mid CTA card: 0 selected", out.midCtaCard.counts.selected === 0, out.midCtaCard);
check("dev mid CTA card: 0 flagged", out.midCtaCard.counts.flagged === 0, out.midCtaCard);
check("dev mid CTA card: draft empty/absent", !out.midCtaCard.draft || (Object.keys(out.midCtaCard.draft.answers || {}).length === 0 && (out.midCtaCard.draft.flags || []).length === 0), out.midCtaCard);
takeConsole("/");

// 7. Reading: answer q5 -> F5
await cdp.navigate(BASE + "/reading/practice");
await waitPractice("/reading/practice");
await clickVisible('section[id="q-5"] button[role="radio"]');
await sleep(600);
out.readingAnswer = { counts: await counts(), draft: await draftOf("cdr.reading.draft.v1") };
check("dev reading answer: q5 selected", out.readingAnswer.counts.selectedIds.includes("q-5"), out.readingAnswer);
await cdp.reload();
await waitPractice("/reading/practice");
out.readingF5 = { counts: await counts(), draft: await draftOf("cdr.reading.draft.v1") };
check("dev reading F5: q5 selected", out.readingF5.counts.selectedIds.includes("q-5"), out.readingF5);
check("dev reading F5: draft has q5", !!out.readingF5.draft && Object.keys(out.readingF5.draft.answers || {}).includes("5"), out.readingF5);
takeConsole("/reading/practice");

// 8. Reading: back/forward from home (Activity restore)
await clickVisible('a[href="/"]');
await waitPath("/");
await sleep(500);
await evalx("history.back()");
await waitPractice("/reading/practice");
out.readingBack = { counts: await counts(), draft: await draftOf("cdr.reading.draft.v1") };
check("dev reading back: q5 selected", out.readingBack.counts.selectedIds.includes("q-5"), out.readingBack);
takeConsole("/reading/practice");

// restore
const restore = { restored: false };
try {
  await evalx(`(() => { const o = JSON.parse(${JSON.stringify(JSON.stringify(raw))}); for (const k of Object.keys(o)) { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); } return true; })()`);
  restore.restored = true;
} catch (e) {
  restore.error = String(e);
}
out.restore = restore;
out.allPass = out.asserts.every((a) => a.pass);
out.allConsoleOk = out.consoleByPage.every((p) => p.errors.length === 0 && p.exceptions.length === 0);
cdp.close();
fs.writeFileSync("docs/extracted/verify_dev_strict_resume.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ allPass: out.allPass, allConsoleOk: out.allConsoleOk, asserts: out.asserts.map((a) => ({ pass: a.pass, name: a.name })), restore }, null, 2));
