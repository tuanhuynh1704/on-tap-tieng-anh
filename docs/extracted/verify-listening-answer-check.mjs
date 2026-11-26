import assert from "node:assert/strict";
import { CDP } from "./cdp.mjs";

const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3215";
const keys = "A C B D A D B B C A C A A B A A A B B B B A B A A B B A A A A".split(" ");
const browser = await CDP.connect();
const card = (id) => `document.querySelector('[aria-labelledby="memory-question-${id}"]')`;
const text = (id) => `${card(id)}.textContent`;
const summary = "document.querySelector('[aria-label=\"Điểm luyện nhớ đáp án\"]').textContent";
let passed = 0;

async function verify(name, expression) {
  assert.equal(await browser.eval(expression), true, name);
  console.log(`PASS: ${name}`);
  passed++;
}

async function choose(id, key) {
  await browser.eval(`document.querySelector('input[name="memory-answer-${id}"][value="${key}"]').click()`);
  await browser.waitFor(`document.querySelector('input[name="memory-answer-${id}"][value="${key}"]').checked`);
}

async function click(label) {
  await browser.eval(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === ${JSON.stringify(label)}).click()`);
}

try {
  // Vercel serves analytics only after deployment; stub that external integration locally.
  browser.on("Fetch.requestPaused", ({ requestId }) => {
    browser.send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/javascript" }],
      body: "",
    }).catch((error) => browser.consoleErrors.push(error.message));
  });
  await browser.send("Fetch.enable", { patterns: [{ urlPattern: `${base}/_vercel/insights/script.js*` }] });
  await browser.send("Log.clear");
  browser.consoleErrors.length = 0;
  await browser.setViewport(1440, 1000);
  await browser.navigate(`${base}/listening/answer-check`);
  await browser.waitFor("document.querySelectorAll('input[type=radio]').length === 124");
  const storageBefore = await browser.eval("JSON.stringify({...localStorage})");

  await verify("Exactly 31 questions with four choices each; no question 32", "document.querySelectorAll('section[aria-labelledby]').length === 31 && !document.getElementById('memory-question-32')");
  await verify("No answers revealed and checking disabled on an empty attempt", "!document.body.textContent.includes('Đáp án đúng:') && [...document.querySelectorAll('button')].every(button => button.disabled)");
  await verify("Only the 25 Part II D choices are disabled", "document.querySelectorAll('input[type=radio]:disabled').length === 25 && [...document.querySelectorAll('input[type=radio]:disabled')].every(input => input.value === 'D' && Number(input.name.split('-').at(-1)) >= 7)");
  await verify("Part I D remains available", "[...document.querySelectorAll('input[value=D]')].filter(input => !input.disabled).length === 6");
  await verify("Disabled D remains visible but dimmed", `${card(7)}.querySelector('input[value=D]').nextElementSibling.getBoundingClientRect().width > 0 && Number(getComputedStyle(${card(7)}.querySelector('input[value=D]').nextElementSibling).opacity) < 0.5`);
  await browser.eval(`${card(7)}.querySelector('input[value=D]').click(); ${card(7)}.querySelector('input[value=D]').parentElement.click()`);
  await verify("Neither the disabled input nor its label selects D", `${card(7)}.querySelector('input[value=D]').checked === false && ${summary}.includes('Đã chọn 0/31')`);
  await choose(7, "C");
  await browser.eval(`${card(7)}.querySelector('input[value=C]').focus()`);
  await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await browser.waitFor(`${card(7)}.querySelector('input[value=A]').checked`);
  await verify("Keyboard navigation skips disabled D and wraps to A", `${card(7)}.querySelector('input[value=D]').checked === false && document.activeElement.value === 'A'`);
  await click("Làm lại");
  await browser.waitFor(`${summary}.includes('Đã chọn 0/31')`);

  await choose(1, "A");
  await browser.eval(`${card(1)}.querySelector('button').click()`);
  await browser.waitFor(`${text(1)}.includes('Đúng!')`);
  await verify("A for question 1 earns one point independently", `${summary}.includes('Điểm riêng: 1/31') && ${text(1)}.includes('Đáp án đúng: A')`);
  await verify("Checking one question does not reveal question 2", `!${text(2)}.includes('Đáp án đúng:')`);

  await choose(1, "B");
  await browser.waitFor(`!${text(1)}.includes('Đáp án đúng:')`);
  await verify("Changing a checked answer invalidates the result", `${summary}.includes('Chưa chấm điểm') && !${card(1)}.querySelector('button').disabled`);
  await browser.eval(`${card(1)}.querySelector('button').click()`);
  await browser.waitFor(`${text(1)}.includes('Sai.')`);
  await verify("Wrong answer earns zero and reveals the correct key", `${summary}.includes('Điểm riêng: 0/31') && ${text(1)}.includes('Đáp án đúng: A')`);

  await click("Chấm điểm 31 câu");
  await browser.waitFor(`${summary}.includes('Đã kiểm tra 31/31')`);
  await verify("Partial submission scores blanks as zero", `${summary}.includes('0 đúng · 1 sai · 30 bỏ trống') && ${text(31)}.includes('Chưa chọn đáp án (0 điểm)')`);

  await choose(31, "A");
  await browser.waitFor(`!${text(31)}.includes('Đáp án đúng:')`);
  await verify("Changing a blank invalidates only that question", `${summary}.includes('Đã kiểm tra 30/31') && ${text(1)}.includes('Sai.')`);

  await click("Làm lại");
  await browser.waitFor(`${summary}.includes('Đã chọn 0/31')`);
  await verify("Reset clears choices, score, and revealed answers", "document.querySelectorAll('input:checked').length === 0 && !document.body.textContent.includes('Đáp án đúng:')");

  await browser.eval("document.querySelector('input[name=memory-answer-1][value=A]').focus()");
  await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await browser.waitFor("document.querySelector('input[name=memory-answer-1][value=B]').checked");
  await verify("Native radio choices support arrow-key navigation", "document.activeElement.value === 'B'");

  for (const [index, key] of keys.entries()) await choose(index + 1, key);
  await click("Chấm điểm 31 câu");
  await browser.waitFor(`${summary}.includes('Điểm riêng: 31/31')`);
  await verify("All correct earns 31/31 and 100 percent", `${summary}.includes('100%') && ${summary}.includes('31 đúng · 0 sai · 0 bỏ trống')`);

  for (const [index, key] of keys.entries()) await choose(index + 1, key === "A" ? "B" : "A");
  await click("Chấm điểm 31 câu");
  await browser.waitFor(`${summary}.includes('0 đúng · 31 sai')`);
  await verify("All incorrect valid choices earn zero", `${summary}.includes('Điểm riêng: 0/31') && ${text(31)}.includes('Bạn chọn B.')`);

  for (const width of [1440, 768, 390, 360]) {
    await browser.setViewport(width, 1000, width < 768);
    await verify(`No horizontal overflow at ${width}px`, "document.documentElement.scrollWidth <= window.innerWidth");
    await verify(`Answer controls meet 44px height at ${width}px`, "[...document.querySelectorAll('fieldset label > span')].every(element => element.getBoundingClientRect().height >= 44)");
    if (width === 1440 || width === 390) {
      await browser.eval("window.scrollTo(0, 0)");
      await browser.screenshot(`C:/Users/nkocn/AppData/Local/Temp/kilo/listening-answer-check-${width}.png`);
      await browser.eval(`${card(7)}.scrollIntoView({block: 'center'})`);
      await browser.screenshot(`C:/Users/nkocn/AppData/Local/Temp/kilo/listening-answer-check-disabled-${width}.png`);
    }
  }

  assert.equal(await browser.eval("JSON.stringify({...localStorage})"), storageBefore, "Practice must not change exam storage");
  console.log("PASS: Exam drafts, history, and scores remain untouched");
  passed++;
  await browser.navigate(`${base}/`);
  await browser.waitFor("document.querySelector('a[href=\"/listening/answer-check\"]') !== null");
  await verify("Home links to the separate memorization practice", "document.querySelector('a[href=\"/listening/answer-check\"]').textContent.includes('Học thuộc đáp án Listening Part 1-2')");
  await browser.navigate(`${base}/review`);
  await browser.waitFor("document.querySelector('a[href=\"/listening/answer-check\"]') !== null");
  await verify("Listening review links to separate scoring", "document.querySelector('a[href=\"/listening/answer-check\"]').textContent.includes('Học thuộc đáp án Listening Part 1-2')");
  assert.deepEqual(browser.exceptions, [], "No uncaught browser exceptions");
  assert.deepEqual(browser.consoleErrors, [], "No browser console errors");
  console.log(`RESULT: ${passed} checks passed; no console errors or uncaught exceptions.`);
} finally {
  browser.close();
}
