// Run with: node --experimental-strip-types --test tests/mistake-retry.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { pickRetryQuestions } from "../src/lib/mistake-retry.ts";

const missed = Object.freeze(Array.from({ length: 8 }, (_, i) => ({ id: 2 * i + 1 })));

test("includes every missed question for pools of zero to five", () => {
  for (let size = 0; size <= 5; size++) {
    const pool = missed.slice(0, size);
    assert.deepEqual(pickRetryQuestions(pool), pool);
  }
});

test("can draw later misses without duplicates or reordering the original pool", (t) => {
  t.mock.method(Math, "random", () => 0.999);
  const picked = pickRetryQuestions(missed);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked).size, 5);
  assert.ok(picked.every((q) => missed.includes(q)));
  assert.ok(picked.includes(missed.at(-1)));
  assert.deepEqual(picked, [...picked].sort((a, b) => a.id - b.id));
});
