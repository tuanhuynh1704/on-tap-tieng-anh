import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { startedAt: new Date().toISOString() };

function snap(c, key) {
  out[key] = { errors: [...c.consoleErrors], exceptions: c.exceptions.slice(0, 3) };
  c.consoleErrors = [];
  c.exceptions = [];
}

async function goto(c, url, ready) {
  c.consoleErrors = [];
  c.exceptions = [];
  await c.navigate(BASE + url);
  if (ready) await c.waitFor(ready, 60000);
  await sleep(400);
}

const c = await CDP.connect();
await c.setViewport(1440, 900, false);

// 1. Nested <a> check on both practice pages
for (const [label, url] of [
  ["readingPractice", "/reading/practice"],
  ["listeningPractice", "/practice"],
]) {
  await goto(c, url, `document.querySelectorAll('section[id^="q-"]').length >= 100`);
  out[label + "NestedA"] = await c.eval(
    `document.querySelectorAll('a a').length`
  );
  out[label + "LinkContainingLink"] = await c.eval(
    `[...document.querySelectorAll('a')].filter(a=>a.querySelector('a')).length`
  );
  snap(c, label + "Console");
}

// 2. Scroll jump (wait for smooth scroll to settle)
await goto(c, "/reading/practice", `document.querySelectorAll('section[id^="q-"]').length >= 100`);
out.chip31 = await c.eval(`(()=>{
  const b=[...document.querySelectorAll('button')].find(x=>x.title && x.title.includes('Câu 31'));
  if(!b) return {ok:false}; b.click(); return {ok:true,label:b.textContent.trim()};
})()`);
await sleep(1200);
out.chip31Scroll = await c.eval(`(()=>{
  const el=document.getElementById('q-31'); const r=el.getBoundingClientRect();
  return {top:Math.round(r.top),bottom:Math.round(r.bottom),innerHeight:window.innerHeight,scrollY:Math.round(scrollY),inView:r.top>-10&&r.top<window.innerHeight-80};
})()`);
out.nav100 = await c.eval(`(()=>{
  const b=document.querySelector('button[aria-label^="Câu 100"]');
  if(!b) return {ok:false}; b.click(); return {ok:true,label:b.getAttribute('aria-label')};
})()`);
await sleep(1500);
out.nav100Scroll = await c.eval(`(()=>{
  const el=document.getElementById('q-100'); const r=el.getBoundingClientRect();
  return {top:Math.round(r.top),bottom:Math.round(r.bottom),innerHeight:window.innerHeight,scrollY:Math.round(scrollY),inView:r.top>-10&&r.top<window.innerHeight-80};
})()`);

// 3. Review toggle persistence
await goto(c, "/reading/review", `document.body.innerText.includes('Toàn bộ 100 câu')`);
out.reviewInitially = await c.eval(`(()=>{
  const bs=[...document.querySelectorAll('button[aria-pressed]')].filter(b=>/^(Đã nắm|Chưa nắm)$/.test(b.textContent.trim()));
  return {count:bs.length, pressed:bs.filter(b=>b.getAttribute('aria-pressed')==='true').length, sample:bs[0]?.textContent.trim()};
})()`);
out.toggle = await c.eval(`(()=>{
  const b=[...document.querySelectorAll('button[aria-pressed]')].find(x=>x.textContent.trim()==='Chưa nắm');
  if(!b) return {ok:false}; b.click(); return {ok:true};
})()`);
await sleep(300);
out.afterToggle = await c.eval(`(()=>({
  key:localStorage.getItem('cdr.reading.mastered.v1'),
  pressed:[...document.querySelectorAll('button[aria-pressed]')].filter(b=>b.getAttribute('aria-pressed')==='true').length
}))()`);
await c.reload();
await c.waitFor(`document.body.innerText.includes('Toàn bộ 100 câu')`, 60000);
await sleep(300);
out.afterReload = await c.eval(`(()=>({
  key:localStorage.getItem('cdr.reading.mastered.v1'),
  pressed:[...document.querySelectorAll('button[aria-pressed]')].filter(b=>b.getAttribute('aria-pressed')==='true').length
}))()`);
snap(c, "reviewConsole");

// cleanup only the key we created
out.cleanup = await c.eval(`(()=>{
  const k='cdr.reading.mastered.v1'; const had=localStorage.getItem(k);
  if(had && Object.keys(JSON.parse(had)).length===1) { localStorage.removeItem(k); return 'removed-test-key'; }
  return 'kept-user-data';
})()`);

out.finishedAt = new Date().toISOString();
fs.writeFileSync("docs/extracted/recheck.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 4000));
c.close();
