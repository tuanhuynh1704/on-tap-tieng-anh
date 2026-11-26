import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CDP } from "./cdp.mjs";
import { sections } from "./memorization-fixtures.mjs";

const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3215";
const cdpHost = "http://127.0.0.1:9222";
const target = await (await fetch(`${cdpHost}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
const browser = new CDP(ws);
for (const domain of ["Page", "Runtime", "Log"]) await browser.send(`${domain}.enable`);
const screenshots = path.join(tmpdir(), "kilo");
mkdirSync(screenshots, { recursive: true });
let passed = 0;
let originalStorage;
const storageExpression = "JSON.stringify(Object.entries(localStorage).sort(([a], [b]) => a.localeCompare(b)))";
// Next.js keeps earlier routes in hidden Activity trees after client navigation.
const main = "([...document.querySelectorAll('main')].find(element => element.getClientRects().length > 0))";

async function verify(name, expression) {
  const actual = await browser.eval(expression);
  if (actual !== true) {
    console.error(await browser.eval("JSON.stringify({path:location.pathname,mains:[...document.querySelectorAll('main')].map(main=>({visible:main.getClientRects().length>0,text:main.textContent.slice(0,1200)})),checked:[...document.querySelectorAll('input:checked')].map(input=>({name:input.name,visible:input.getClientRects().length>0}))})"));
  }
  assert.equal(actual, true, name);
  console.log(`PASS: ${name}`);
  passed++;
}

try {
  // This deployment-only integration is unrelated to local scoring behavior.
  browser.on("Fetch.requestPaused", ({ requestId }) => {
    browser.send("Fetch.fulfillRequest", {
      requestId, responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/javascript" }], body: "",
    }).catch((error) => browser.consoleErrors.push(error.message));
  });
  await browser.send("Fetch.enable", { patterns: [{ urlPattern: `${base}/_vercel/insights/script.js*` }] });
  await browser.navigate(`${base}${sections[0].route}`);
  await browser.waitFor("document.querySelectorAll('input[type=radio]').length === 124");
  originalStorage = await browser.eval("Object.entries(localStorage)");
  const seed = {};
  for (const prefix of ["cdr", "cdr.reading"]) {
    seed[`${prefix}.draft.v1`] = JSON.stringify({ answers: { 1: "A" }, flags: [1], savedAt: 123 });
    seed[`${prefix}.history.v1`] = "[]";
    seed[`${prefix}.mastered.v1`] = JSON.stringify({ 1: true });
  }
  await browser.eval(`Object.entries(${JSON.stringify(seed)}).forEach(([key, value]) => localStorage.setItem(key, value))`);
  const seededStorage = await browser.eval(storageExpression);

  for (const [index, section] of sections.entries()) {
    const { questions, count, max, name, module } = section;
    const prefix = module === "reading" ? "reading-memory" : "memory";
    const summaryLabel = module === "reading" ? "Điểm luyện nhớ đáp án Reading" : "Điểm luyện nhớ đáp án";
    const summary = `${main}.querySelector('[aria-label=${JSON.stringify(summaryLabel)}]')`;
    const summaryText = `${summary}.textContent`;
    const card = (id) => `${main}.querySelector('[aria-labelledby="${prefix}-question-${id}"]')`;
    const first = questions[0];
    const second = questions[1];
    const wrong = (question) => question.options.find((o) => o.key !== question.answer).key;

    if (index > 0 && sections[index - 1].module === module) {
      await browser.eval(`${main}.querySelector('nav a[href="${section.route}"]').click()`);
      await browser.waitFor(`location.pathname === ${JSON.stringify(section.route)}`);
    } else {
      await browser.navigate(`${base}${section.route}`);
    }
    await browser.waitFor(`${card(first.id)} !== null && ${summary} !== null`);
    await verify(`${name}: new route has no answers or score`, `${summaryText}.includes('Chưa chấm điểm') && ${main}.querySelectorAll('input:checked').length === 0 && !${main}.textContent.includes('Đáp án đúng:')`);
    await verify(`${name}: score status is announced accessibly`, `${summary}.querySelector('[role=status]').getAttribute('aria-live') === 'polite'`);
    await verify(`${name}: maximum and estimate explanation are visible`, `${summaryText}.includes('tối đa ${max} điểm') && ${summaryText}.includes('không phải điểm TOEIC chính thức')`);

    async function choose(question, key) {
      const input = `${main}.querySelector('input[name="${prefix}-answer-${question.id}"][value="${key}"]')`;
      // Retry the first interaction until React has hydrated and accepted the answer.
      await browser.waitFor(`(() => { ${input}.click(); return ${input}.checked && ${card(question.id)}.textContent.includes('Đã chọn ${key}.'); })()`);
    }
    async function click(label) {
      await browser.eval(`[...${main}.querySelectorAll('button')].find(button => button.textContent.trim() === ${JSON.stringify(label)}).click()`);
    }
    async function checkQuestion(question) {
      await browser.eval(`${card(question.id)}.querySelector('button').click()`);
      await browser.waitFor(`${card(question.id)}.textContent.includes('Đáp án đúng:')`);
    }

    await choose(first, first.answer);
    await verify(`${name}: choosing alone does not earn points`, `${summaryText}.includes('Chưa chấm điểm') && !${card(first.id)}.textContent.includes('Đáp án đúng:')`);
    await checkQuestion(first);
    await verify(`${name}: one correct checked answer earns provisional 4.95`, `${summaryText}.includes('Điểm quy đổi tạm tính: 4.95/${max}') && ${summaryText}.includes('Điểm riêng: 1/${count}') && !${card(second.id)}.textContent.includes('Đáp án đúng:')`);

    await choose(first, wrong(first));
    await verify(`${name}: changing the only checked answer removes its score`, `${summaryText}.includes('Chưa chấm điểm') && !${card(first.id)}.textContent.includes('Đáp án đúng:')`);
    await checkQuestion(first);
    await verify(`${name}: incorrect checked answer earns zero`, `${summaryText}.includes('Điểm quy đổi tạm tính: 0/${max}') && ${card(first.id)}.textContent.includes('Sai.')`);

    await choose(second, second.answer);
    await click(`Chấm điểm ${count} câu`);
    await browser.waitFor(`${summaryText}.includes('Đã kiểm tra ${count}/${count}')`);
    await verify(`${name}: full submission distinguishes wrong and blank`, `${summaryText}.includes('1 đúng · 1 sai · ${count - 2} bỏ trống') && ${summaryText}.includes('Điểm quy đổi: 4.95/${max}') && ${summaryText}.includes('· ${Math.round(100 / count)}%')`);
    await choose(first, first.answer);
    await verify(`${name}: editing a final result makes it provisional`, `${summaryText}.includes('Đã kiểm tra ${count - 1}/${count}') && ${summaryText}.includes('Điểm quy đổi tạm tính: 4.95/${max}') && ${card(second.id)}.textContent.includes('Đúng!')`);
    await click(`Chấm điểm ${count} câu`);
    await browser.waitFor(`${summaryText}.includes('Điểm quy đổi: 9.9/${max}')`);
    await verify(`${name}: rechecking includes the corrected answer`, `${summaryText}.includes('2 đúng · 0 sai · ${count - 2} bỏ trống')`);

    await click("Làm lại");
    await browser.waitFor(`${summaryText}.includes('Chưa chấm điểm')`);
    const correctAnswers = questions.map((q) => [q.id, q.answer]);
    await browser.eval(`${JSON.stringify(correctAnswers)}.forEach(([id, key]) => ${main}.querySelector('input[name="${prefix}-answer-' + id + '"][value="' + key + '"]').click())`);
    await browser.waitFor(`${summaryText}.includes('Đã chọn ${count}/${count}')`);
    await click(`Chấm điểm ${count} câu`);
    await browser.waitFor(`${summaryText}.includes('Điểm quy đổi: ${max}/${max}')`);
    await verify(`${name}: all correct earns the exact maximum and 100%`, `${summaryText}.includes('Điểm riêng: ${count}/${count} · 100%') && ${summaryText}.includes('${count} đúng · 0 sai · 0 bỏ trống')`);

    for (const width of [1440, 768, 390, 360]) {
      await browser.setViewport(width, 1000, width < 768);
      await verify(`${name}: responsive controls at ${width}px`, `document.documentElement.scrollWidth <= innerWidth && [...${main}.querySelectorAll('input[type=radio]')].every(input => input.nextElementSibling.getBoundingClientRect().height >= 44)`);
      if ((index === 0 || index === 5) && (width === 1440 || width === 390)) {
        await browser.eval("window.scrollTo(0, 0)");
        await browser.screenshot(path.join(screenshots, `memorization-${module}-${width}.png`));
      }
    }

    const wrongAnswers = questions.map((q) => [q.id, wrong(q)]);
    await browser.eval(`${JSON.stringify(wrongAnswers)}.forEach(([id, key]) => ${main}.querySelector('input[name="${prefix}-answer-' + id + '"][value="' + key + '"]').click())`);
    await click(`Chấm điểm ${count} câu`);
    await browser.waitFor(`${summaryText}.includes('0 đúng · ${count} sai')`);
    await verify(`${name}: all incorrect earns zero`, `${summaryText}.includes('Điểm quy đổi: 0/${max}')`);
    await click("Làm lại");
    await browser.waitFor(`${summaryText}.includes('Chưa chấm điểm')`);
    await verify(`${name}: reset clears answers and all graded feedback`, `${main}.querySelectorAll('input:checked').length === 0 && !${main}.textContent.includes('Đáp án đúng:')`);
    assert.equal(await browser.eval(storageExpression), seededStorage, `${name}: exam drafts, history, and mastered flags stay untouched`);
    console.log(`PASS: ${name}: full-exam storage is unchanged`);
    passed++;
    // Leave a scored answer before the next client-side route transition.
    await choose(first, first.answer);
    await checkQuestion(first);
  }
  assert.deepEqual(browser.exceptions, [], "No uncaught browser exceptions");
  assert.deepEqual(browser.consoleErrors, [], "No application or resource errors with local analytics stubbed");
  console.log(`RESULT: ${passed} browser checks passed across all six sections; no browser errors.`);
} finally {
  if (originalStorage) {
    await browser.eval(`localStorage.clear(); ${JSON.stringify(originalStorage)}.forEach(([key, value]) => localStorage.setItem(key, value))`);
  }
  browser.close();
  await fetch(`${cdpHost}/json/close/${target.id}`);
}
