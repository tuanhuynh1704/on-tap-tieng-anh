// Reproduce Founder flow on the live dev server (:3000):
// practice -> answer -> submit -> results -> home -> "Làm Listening" -> inspect.
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SEL_SELECTED = 'section[id^="q-"] button[role="radio"][aria-checked="true"]';
const out = {};

const c = await CDP.connect();
await c.setViewport(1440, 900, false);
c.consoleErrors.length = 0;
c.exceptions.length = 0;

const rawDraft = await (async () => {
  await c.navigate(BASE + "/");
  return c.eval(`localStorage.getItem('cdr.draft.v1')`);
})();

// 1. Start a practice attempt
await c.navigate(BASE + "/practice");
await c.waitFor(`document.querySelectorAll('section[id^="q-"]').length === 100`, 90000);
await sleep(600);
await c.eval(`(()=>{const s=document.querySelector('section[id="q-1"]');s.querySelector('button[role="radio"]').click();return true})()`);
await sleep(600);
out.draftAfterAnswer = await c.eval(`(()=>{const v=localStorage.getItem('cdr.draft.v1');return v?JSON.parse(v):null})()`);

// 2. Submit via header button + dialog
out.openDialog = await c.eval(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Nộp bài');if(!bs.length)return 'no-button';bs[0].click();return bs.length})()`);
await c.waitFor(`document.querySelector('div[role="dialog"]') !== null`, 10000);
out.confirm = await c.eval(`(()=>{const d=document.querySelector('div[role="dialog"]');const bs=[...d.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Nộp bài');if(!bs.length)return 'no-confirm';bs[0].click();return true})()`);
await c.waitFor(`new URL(location.href).pathname === '/results'`, 45000);
await sleep(800);
out.resultsUrl = await c.eval(`location.href`);
out.draftAfterSubmit = await c.eval(`localStorage.getItem('cdr.draft.v1')`);
out.historyLen = await c.eval(`(()=>{const v=localStorage.getItem('cdr.history.v1');return v?JSON.parse(v).length:0})()`);

// 3. Go home via header link (SPA)
out.homeClick = await c.eval(`(()=>{const a=[...document.querySelectorAll('a[href="/"]')].find(x=>x.textContent.includes('TOEIC REVISION'));if(!a)return 'no-home-link';a.click();return true})()`);
await c.waitFor(`new URL(location.href).pathname === '/'`, 45000);
await sleep(1200);

// 4. Click hero "Làm Listening"
out.ctaClick = await c.eval(`(()=>{const els=[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening"));if(!els.length)return 'no-cta';els[0].click();return els.length})()`);
await c.waitFor(`new URL(location.href).pathname === '/practice'`, 45000);
await c.waitFor(`document.querySelectorAll('section[id^="q-"]').length === 100`, 90000);
await sleep(900);

out.afterCta = {
  url: await c.eval(`location.href`),
  // visible filter — Activity của dev-StrictMode giữ DOM ẩn vẫn nằm trong document
  selected: await c.eval(`(()=>{const secs=[...document.querySelectorAll('section[id^="q-"]')].filter(el=>el.getClientRects().length>0);return secs.filter(s=>s.querySelector('button[role="radio"][aria-checked="true"]')).length})()`),
  flagged: await c.eval(`(()=>{const secs=[...document.querySelectorAll('section[id^="q-"]')].filter(el=>el.getClientRects().length>0);return secs.filter(s=>s.querySelector('button[aria-pressed="true"]')).length})()`),
  timer: await c.eval(`(()=>{const e=document.querySelector('span[role="timer"]');return e?e.textContent:null})()`),
  savedText: await c.eval(`(()=>{const e=[...document.querySelectorAll('span')].find(x=>x.textContent.startsWith('Đã lưu nháp'));return e?e.textContent:null})()`),
  draft: await c.eval(`(()=>{const v=localStorage.getItem('cdr.draft.v1');return v?JSON.parse(v):null})()`),
  draftEmpty: await c.eval(`(()=>{const v=localStorage.getItem('cdr.draft.v1');if(!v)return true;const d=JSON.parse(v);return Object.keys(d.answers||{}).length===0&&(d.flags||[]).length===0})()`),
};
out.consoleErrors = [...c.consoleErrors];
out.exceptions = [...c.exceptions];

// restore draft only (history from this real test is a genuine test attempt; remove it)
await c.eval(rawDraft === null ? `localStorage.removeItem('cdr.draft.v1')` : `localStorage.setItem('cdr.draft.v1', ${JSON.stringify(rawDraft)})`);

fs.writeFileSync("docs/extracted/repro_submit_flow.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
c.close();
