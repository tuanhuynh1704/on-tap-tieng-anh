import assert from "node:assert/strict";
import { exam, reading, readingStorage, scoring, sections } from "./memorization-fixtures.mjs";

const { scoreMemorizationAnswers: score, formatScaledScore: format } = scoring;
let passed = 0;
function check(name, verify) {
  verify();
  passed++;
  console.log(`PASS: ${name}`);
}

check("Empty subsets produce finite zero scores and ignore unrelated answers", () => {
  assert.deepEqual(score([], { 1: "A" }), {
    total: 0, checked: 0, correct: 0, wrong: 0, blank: 0, remaining: 0,
    percentage: 0, scaled: 0, maxScaled: 0,
  });
});

const questions = Object.freeze([
  { id: 1, answer: "A" }, { id: 2, answer: "B" },
  { id: 3, answer: "C" }, { id: 4, answer: "D" },
].map(Object.freeze));
const mixed = Object.freeze({ 1: "A", 2: "A", 3: null, 4: undefined, 999: "A" });
check("Correct, wrong, blank, and unchecked answers remain distinct", () => {
  assert.deepEqual(score(questions, mixed), {
    total: 4, checked: 3, correct: 1, wrong: 1, blank: 1, remaining: 1,
    percentage: 25, scaled: 4.95, maxScaled: 19.8,
  });
  assert.deepEqual(Object.keys(mixed), ["1", "2", "3", "4", "999"]);
  assert.equal(mixed[3], null);
});
check("Invalid answer strings never earn points", () => {
  assert.equal(score(questions, { 1: "invalid" }).wrong, 1);
  assert.equal(score(questions, { 1: "invalid" }).scaled, 0);
});
check("Removing a checked answer invalidates only its contribution", () => {
  const answers = { 1: "A", 2: "B", 3: null };
  delete answers[1];
  const result = score(questions, answers);
  assert.equal(result.checked, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.blank, 1);
  assert.equal(result.remaining, 2);
  assert.equal(result.scaled, 4.95);
});
check("Display formatting removes floating-point tails and unnecessary zeros", () => {
  for (const [value, expected] of [[0, "0"], [4.95, "4.95"], [14.850000000000001, "14.85"], [148.5, "148.5"], [193.05, "193.05"], [495, "495"]]) {
    assert.equal(format(value), expected);
  }
});

for (const section of sections) {
  const { questions, count, max, name } = section;
  check(`${name}: independent question count and maximum`, () => {
    assert.equal(questions.length, count);
    assert.equal(format(score(questions, {}).maxScaled), max);
    assert.equal(score(questions, {}).remaining, count);
  });
  check(`${name}: all correct earns the section maximum`, () => {
    const result = score(questions, Object.fromEntries(questions.map((q) => [q.id, q.answer])));
    assert.equal(result.correct, count);
    assert.equal(result.checked, count);
    assert.equal(result.remaining, 0);
    assert.equal(result.percentage, 100);
    assert.equal(format(result.scaled), max);
  });
  check(`${name}: all incorrect and all blank earn zero`, () => {
    for (const blank of [false, true]) {
      const answers = Object.fromEntries(questions.map((q) => [q.id, blank ? null : q.options.find((o) => o.key !== q.answer).key]));
      const result = score(questions, answers);
      assert.equal(result.scaled, 0);
      assert.equal(result.percentage, 0);
      assert.equal(result.checked, count);
      assert.equal(result.blank, blank ? count : 0);
      assert.equal(result.wrong, blank ? 0 : count);
    }
  });
  check(`${name}: partial percentages use the section denominator`, () => {
    const result = score(questions, { [questions[0].id]: questions[0].answer, 999: "A" });
    assert.equal(result.correct, 1);
    assert.equal(result.checked, 1);
    assert.equal(result.percentage, Math.round(100 / count));
    assert.equal(result.scaled, 4.95);
    assert.equal(result.remaining, count - 1);
  });
}

for (const moduleName of ["listening", "reading"]) {
  check(`${moduleName}: section maxima sum to 495`, () => {
    assert.equal(format(sections.filter((s) => s.module === moduleName).reduce((sum, s) => sum + Number(s.max), 0)), "495");
  });
}

for (const [name, questions, fullScore] of [
  ["Listening", exam.QUESTIONS, scoring.scoreAnswers],
  ["Reading", reading.READING_QUESTIONS, readingStorage.scoreReadingAnswers],
]) {
  check(`${name}: full-exam zero, half, and perfect scores remain unchanged`, () => {
    for (const [count, expected] of [[0, 0], [50, 247.5], [100, 495]]) {
      const result = fullScore(Object.fromEntries(questions.slice(0, count).map((q) => [q.id, q.answer])));
      assert.equal(result.raw, count);
      assert.equal(result.scaled, expected);
      assert.equal(result.perPart.reduce((sum, p) => sum + p.total, 0), 100);
      assert.equal(result.perPart.reduce((sum, p) => sum + p.correct, 0), count);
    }
  });
}

console.log(`RESULT: ${passed} scoring checks passed.`);
