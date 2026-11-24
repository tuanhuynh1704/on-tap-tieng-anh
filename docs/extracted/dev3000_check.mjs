// Quick check against the running dev server (:3000) that the fresh-start CTA is live.
import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SEL_SELECTED = 'section[id^="q-"] button[role="radio"][aria-checked="true"]';
const SEL_FLAGGED = 'section[id^="q-"] button[aria-label^="Bỏ đánh dấu"]';

const c = await CDP.connect();
await c.setViewport(1440, 900, false);
c.consoleErrors.length = 0;
c.exceptions.length = 0;

await c.navigate(BASE + "/");
const rawDraft = await c.eval(`localStorage.getItem('cdr.draft.v1')`);
const rawHistory = await c.eval(`localStorage.getItem('cdr.history.v1')`);

await c.waitFor(`[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening")).length >= 1`, 60000);
await sleep(1800);
await c.eval(`localStorage.setItem('cdr.draft.v1', JSON.stringify({answers:{1:"A",2:"B"},flags:[1],savedAt:Date.now()}))`);
await c.eval(`(()=>{const els=[...document.querySelectorAll('a[href="/practice"]')].filter(a=>(a.textContent||"").includes("Làm Listening"));els[0].click();return true})()`);
await c.waitFor(`new URL(location.href).pathname === "/practice"`, 60000);
await c.waitFor(`document.querySelectorAll('section[id^="q-"]').length === 100`, 90000);
await sleep(700);

const result = {
  url: await c.eval(`location.href`),
  selected: await c.eval(`document.querySelectorAll(${JSON.stringify(SEL_SELECTED)}).length`),
  flagged: await c.eval(`document.querySelectorAll(${JSON.stringify(SEL_FLAGGED)}).length`),
  timer: await c.eval(`(()=>{const e=document.querySelector('span[role="timer"]');return e?e.textContent:null})()`),
  draft: await c.eval(`(()=>{const v=localStorage.getItem('cdr.draft.v1');return v===null?null:JSON.parse(v)})()`),
  consoleErrors: [...c.consoleErrors],
  exceptions: [...c.exceptions],
};

// restore
await c.eval(rawDraft === null ? `localStorage.removeItem('cdr.draft.v1')` : `localStorage.setItem('cdr.draft.v1', ${JSON.stringify(rawDraft)})`);
await c.eval(rawHistory === null ? `localStorage.removeItem('cdr.history.v1')` : `localStorage.setItem('cdr.history.v1', ${JSON.stringify(rawHistory)})`);

result.dev3000Pass =
  result.selected === 0 &&
  result.flagged === 0 &&
  (result.draft === null || Object.keys(result.draft.answers || {}).length === 0);
fs.writeFileSync("docs/extracted/dev3000_check.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
c.close();
