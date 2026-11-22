import fs from 'node:fs';
import path from 'node:path';
import { CDP } from './cdp.mjs';

const REPO = 'C:\\Users\\nkocn\\OneDrive\\Desktop\\Plan\\on-tap-ta-cdr';
const BASE = 'http://localhost:3000';
const OUT = path.join(REPO, 'docs', 'extracted', 'report.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const report = {
  startedAt: new Date().toISOString(),
  screenshots: {}, counts: {}, interactions: {}, checks: {},
  console: {}, uiIssues: [], cleanup: {},
};
let c;

function shot(name) { return path.join(REPO, name); }
async function snap(label) {
  report.console[label] = { errors: [...c.consoleErrors], exceptions: [...c.exceptions] };
  c.consoleErrors = []; c.exceptions = [];
}
async function goto(url, readyExpr, label) {
  c.consoleErrors = []; c.exceptions = [];
  await c.navigate(BASE + url);
  if (readyExpr) await c.waitFor(readyExpr, 60000);
  await sleep(1800);
  await snap(label);
}
async function stage(name, fn) {
  try { report[name] = await fn(); console.log('STAGE', name, 'OK'); }
  catch (e) { report[name] = { ERROR: String(e && e.stack || e) }; console.log('STAGE', name, 'ERROR', String(e)); }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
}
async function clickByText(selector, text, exact) {
  return c.eval(`(()=>{
    const els=[...document.querySelectorAll(${JSON.stringify(selector)})];
    const needle=${JSON.stringify(text)};
    const el=els.find(e=>${exact ? 'e.textContent.trim()===needle' : 'e.textContent.includes(needle)'});
    if(!el) return {ok:false, samples:els.slice(0,15).map(e=>e.textContent.trim().slice(0,50))};
    el.click(); return {ok:true, text:el.textContent.trim()};
  })()`);
}
async function answer(id, key) {
  return c.eval(`(()=>{
    const s=document.getElementById('q-${id}'); if(!s) return 'no-section';
    const b=[...s.querySelectorAll('button[role="radio"]')].find(x=>x.textContent.trim().startsWith(${JSON.stringify(key)}));
    if(!b) return 'no-option'; b.click(); return 'clicked:'+b.textContent.trim().slice(0,8);
  })()`);
}

try {
  c = await CDP.connect();
  console.log('CDP connected');

  // ---- capture pre-existing localStorage (origin localhost:3000) ----
  await goto('/reading/practice', `document.querySelectorAll('section[id^="q-"]').length>=100`, 'practice-initial');
  const initialLS = await c.eval(`(()=>{const o={};for(const k of Object.keys(localStorage))o[k]=localStorage.getItem(k);return o;})()`);
  report.initialLocalStorageKeys = Object.keys(initialLS);
  console.log('initial localStorage keys:', Object.keys(initialLS));

  // ============ 2. SCREENSHOTS (the ones not needing an attempt) ============
  await stage('shotsEarly', async () => {
    const out = {};
    await c.setViewport(1440, 900, false);
    await goto('/reading/practice', `document.querySelectorAll('section[id^="q-"]').length>=100`, 'practice-desktop');
    out.desktop = await c.screenshot(shot('reading-practice-desktop.png'));

    await c.setViewport(375, 812, true);
    await c.reload();
    await c.waitFor(`document.querySelectorAll('section[id^="q-"]').length>=100`, 60000);
    await sleep(400);
    out.mobile = await c.screenshot(shot('reading-practice-mobile.png'));

    await c.setViewport(1440, 900, false);
    await goto('/reading/review', `document.body.innerText.length>1000`, 'review-load');
    out.review = await c.screenshot(shot('reading-review.png'));

    await goto('/', `document.body.innerText.length>200`, 'home-load');
    out.home = await c.screenshot(shot('home-two-cards.png'));

    await goto('/practice', `document.body.innerText.length>500`, 'listening-load');
    out.listening = await c.screenshot(shot('listening-practice-regression.png'));
    return out;
  });

  // ============ 3. DOM COUNTS ============
  await stage('counts', async () => {
    await goto('/reading/practice', `document.querySelectorAll('section[id^="q-"]').length>=100`, 'practice-counts');
    return c.eval(`(()=>{
      const sections=document.querySelectorAll('section[id^="q-"]');
      const passages=[...document.querySelectorAll('div[id^="passage-"]')];
      const blankBtns=[...document.querySelectorAll('button[title*="chỗ trống"]')];
      const p6=passages.filter(p=>p.querySelector('button[title*="chỗ trống"]'));
      const p7=passages.filter(p=>!p.querySelector('button[title*="chỗ trống"]'));
      const markerSpans=[...document.querySelectorAll('span[aria-hidden="true"]')].filter(s=>/^\\[[1-4]\\]$/.test(s.textContent.trim()));
      const bodyText=document.body.innerText;
      const braces=bodyText.match(/\\{\\{\\d+\\}\\}/g)||[];
      const timer=document.querySelector('[role="timer"]');
      const timerBtn=[...document.querySelectorAll('button')].find(b=>/Tắt giờ|Bật giờ/.test(b.textContent));
      return {
        questionCards: sections.length,
        questionIds: [...sections].map(s=>s.id).slice(0,3).concat(['...',[...sections].slice(-1)[0]?.id]),
        totalPassages: passages.length,
        part6Passages: p6.length,
        part7Passages: p7.length,
        blankChipButtons: blankBtns.length,
        blankChipLabels: blankBtns.map(b=>b.textContent.trim()).slice(0,20),
        braceTokenOccurrences: braces.length,
        braceSamples: braces.slice(0,8),
        markerChips: markerSpans.length,
        markersPresent: [1,2,3,4].map(n=>({n, present: markerSpans.some(s=>s.textContent.trim()==='['+n+']')})),
        timer: timer?timer.textContent.trim():null,
        timerToggle: timerBtn?timerBtn.textContent.trim():null
      };
    })()`);
  });

  // ============ 4a. MINIMAL INTERACTIONS ============
  await stage('interactions', async () => {
    const out = {};
    await goto('/reading/practice', `document.querySelectorAll('section[id^="q-"]').length>=100`, 'practice-interact');
    out.seed = {};
    for (const [id, key] of [[1, 'A'], [2, 'B'], [31, 'D']]) out.seed['q' + id + key] = await answer(id, key);
    out.flagSet = await c.eval(`(()=>{const b=document.querySelector('#q-1 button[aria-label^="Đánh dấu"]');if(!b)return false;b.click();return true;})()`);
    await sleep(350);
    out.draftKeyPresent = await c.eval(`!!localStorage.getItem('cdr.reading.draft.v1')`);

    await c.reload();
    await c.waitFor(`document.querySelectorAll('section[id^="q-"]').length>=100`, 60000);
    await sleep(350);
    out.afterReload = await c.eval(`(()=>{
      const get=(id)=>{const s=document.getElementById('q-'+id);const b=s&&[...s.querySelectorAll('button[role="radio"]')].find(x=>x.getAttribute('aria-checked')==='true');return b?b.textContent.trim().charAt(0):null;};
      return {q1:get(1),q2:get(2),q31:get(31),flagStillSet:!!document.querySelector('#q-1 button[aria-label^="Bỏ đánh dấu"]')};
    })()`);

    out.chip31Click = await c.eval(`(()=>{window.scrollTo(0,0);const b=document.querySelector('button[title^="Câu 31 —"]');if(!b)return 'not-found';b.click();return b.textContent.trim();})()`);
    await sleep(1000);
    out.chip31Scroll = await c.eval(`(()=>{const e=document.getElementById('q-31');const r=e.getBoundingClientRect();return {scrollY:Math.round(window.scrollY),top:Math.round(r.top),inView:r.top>-80&&r.top<300};})()`);

    out.nav100Click = await c.eval(`(()=>{const b=[...document.querySelectorAll('aside button')].find(x=>x.textContent.trim()==='100');if(!b)return 'not-found';b.click();return true;})()`);
    await sleep(1000);
    out.nav100Scroll = await c.eval(`(()=>{const e=document.getElementById('q-100');const r=e.getBoundingClientRect();return {scrollY:Math.round(window.scrollY),top:Math.round(r.top),inView:r.top>-80&&r.top<300};})()`);

    out.progress = await c.eval(`(()=>{const t=document.body.innerText;const a=t.match(/Đã trả lời\\s*(\\d+)\\s*\\/\\s*100/);const m=t.match(/Đã làm\\s*(\\d+)\\s*\\/\\s*100/);return {answered:a?a[0]:null, mobile:m?m[0]:null};})()`);

    await c.setViewport(375, 812, true);
    await sleep(350);
    out.sheetOpen = await clickByText('button', 'Bảng câu hỏi', true);
    await sleep(450);
    out.mobileSheet = await c.eval(`(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,noOverflow:document.documentElement.scrollWidth<=window.innerWidth,dialog:!!document.querySelector('[role="dialog"]'),sheetScrollWidth:(document.querySelector('[role="dialog"] .navigator-scroll')||{}).scrollWidth||null}))()`);
    await c.setViewport(1440, 900, false);
    return out;
  });

  // ============ 4b. SUBMIT -> RESULTS (and results screenshot) ============
  await stage('submitAndResults', async () => {
    const out = {};
    await goto('/reading/practice', `document.querySelectorAll('section[id^="q-"]').length>=100`, 'practice-submit');
    for (const [id, key] of [[1, 'A'], [2, 'B'], [31, 'D']]) await answer(id, key);
    await sleep(250);
    out.submitClick = await clickByText('header button', 'Nộp bài', true);
    await sleep(450);
    const dlg = c.dialogs[c.dialogs.length - 1];
    if (dlg) {
      await c.send('Page.handleJavaScriptDialog', { accept: true });
      c.dialogs = []; out.dialog = 'native-confirm-accepted: ' + dlg.message;
    } else {
      out.modalClick = await clickByText('[role="dialog"] button', 'Nộp bài', true);
      out.dialog = 'react-modal';
    }
    await c.waitFor(`location.href.includes('/reading/results')`, 30000);
    await sleep(600);
    out.url = await c.eval('location.href');
    await snap('results-load');
    out.screenshot = await c.screenshot(shot('reading-results.png'));

    out.content = await c.eval(`(()=>{
      const txt=document.body.innerText;
      const has=(n)=>new RegExp('(^|\\\\D)'+n+'(\\\\D|$)').test(txt);
      return {
        bodyLength:txt.length,
        hasRaw:/raw|Raw|thô/i.test(txt),
        hasScaled:/scaled|Scaled|quy dổi|quy đổi/i.test(txt),
        parts:[5,6,7].map(p=>({part:p,present:txt.includes('Part '+p)})),
        filterOnlyWrong:txt.includes('Chỉ câu sai'),
        filterAll:txt.includes('Tất cả'),
        q31present:has(31), q46present:has(46),
        sample:txt.slice(0,1500)
      };
    })()`);

    await c.reload();
    await sleep(700);
    await snap('results-reload');
    out.afterReload = await c.eval(`(()=>({url:location.href,ok:location.href.includes('/reading/results')&&document.body.innerText.length>200}))()`);
    return out;
  });

  // ============ 4c. REVIEW / LISTENING / HOME CHECKS ============
  await stage('reviewChecks', async () => {
    await goto('/reading/review', `document.body.innerText.length>1000`, 'review-checks');
    const out = {};
    out.questionNodes = await c.eval(`document.querySelectorAll('[id^="q-"]').length`);
    out.accordion = await c.eval(`(()=>{const ds=[...document.querySelectorAll('details')];return {count:ds.length,openCount:ds.filter(d=>d.open).length};})()`);
    out.masteredToggleClick = await clickByText('button', 'Đã nắm', false);
    await sleep(350);
    out.masteredKeyPresent = await c.eval(`!!localStorage.getItem('cdr.reading.mastered.v1')`);
    await c.reload(); await sleep(700);
    out.afterReload = await c.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Đã nắm'));return b?{text:b.textContent.trim(),pressed:b.getAttribute('aria-pressed'),className:b.className.slice(0,120)}:null;})()`);
    out.search = await c.eval(`(()=>{
      const i=document.querySelector('input[type="search"],input[placeholder*="Tìm"],input[placeholder*="tìm"]');
      if(!i) return 'no-search-input';
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(i,'31'); i.dispatchEvent(new Event('input',{bubbles:true}));
      return 'typed:31';
    })()`);
    await sleep(400);
    out.searchResult = await c.eval(`(()=>({value:(document.querySelector('input[type="search"],input[placeholder*="Tìm"],input[placeholder*="tìm"]')||{}).value||null, visibleText:document.body.innerText.slice(0,600)}))()`);
    return out;
  });

  await stage('listeningChecks', async () => {
    await goto('/practice', `document.body.innerText.length>500`, 'listening-checks');
    return c.eval(`(()=>{
      const txt=document.body.innerText;
      return {
        questionNodes:document.querySelectorAll('[id^="q-"]').length,
        hasOnTap:txt.includes('Ôn tập'),
        monogramTR:[...document.querySelectorAll('span,div,a')].some(e=>e.children.length===0&&e.textContent.trim()==='TR'),
        hasListening:txt.toLowerCase().includes('listening')
      };
    })()`);
  });

  await stage('homeChecks', async () => {
    await goto('/', `document.body.innerText.length>200`, 'home-checks');
    return c.eval(`(()=>{const t=document.body.innerText;return {hasListening:/listening/i.test(t),hasReading:/reading/i.test(t),textSample:t.slice(0,700)};})()`);
  });

  await stage('otherRoutes', async () => {
    const out = {};
    for (const p of ['/results', '/review']) {
      await goto(p, `document.body.innerText.length>100`, 'route' + p.replace('/', '-'));
      out[p] = await c.eval(`document.body.innerText.slice(0,300)`);
    }
    return out;
  });

  // ============ 5. CLEANUP ============
  await stage('cleanup', async () => {
    const managed = ['cdr.reading.draft.v1', 'cdr.reading.history.v1', 'cdr.reading.mastered.v1'];
    const before = {};
    for (const k of managed) {
      if (Object.prototype.hasOwnProperty.call(initialLS, k)) {
        await c.eval(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(initialLS[k])})`);
        before[k] = 'restored-preexisting';
      } else {
        await c.eval(`localStorage.removeItem(${JSON.stringify(k)})`);
        before[k] = 'removed-created-by-me';
      }
    }
    const keys = await c.eval(`Object.keys(localStorage)`);
    const removedAttempts = [];
    for (const k of keys) {
      if (!Object.prototype.hasOwnProperty.call(initialLS, k) && /attempt/i.test(k)) {
        await c.eval(`localStorage.removeItem(${JSON.stringify(k)})`);
        removedAttempts.push(k);
      }
    }
    return { handled: before, removedAttempts, finalKeys: await c.eval(`Object.keys(localStorage)`), preexisting: Object.keys(initialLS) };
  });

  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('DONE. report at', OUT);
} catch (e) {
  report.FATAL = String(e && e.stack || e);
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('FATAL', e);
} finally {
  if (c) c.close();
}
