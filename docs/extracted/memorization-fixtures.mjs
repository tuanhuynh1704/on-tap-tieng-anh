import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import ts from "typescript";

const modules = new Map();

// Load real source modules without generating copies or adding a test dependency.
function loadSource(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const loaded = { exports: {} };
  modules.set(name, loaded);
  const source = readFileSync(new URL(`../../src/${name}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const evaluate = new Script(`(function(exports, require, module) {\n${outputText}\n})`, { filename: `${name}.ts` }).runInThisContext();
  evaluate(loaded.exports, (specifier) => {
    if (!specifier.startsWith("@/")) throw new Error(`Unexpected source dependency: ${specifier}`);
    return loadSource(specifier.slice(2));
  }, loaded);
  return loaded.exports;
}

export const exam = loadSource("data/exam");
export const reading = loadSource("data/reading");
export const scoring = loadSource("lib/scoring");
export const readingStorage = loadSource("lib/reading-storage");

export const sections = [
  { name: "Listening Part 1-2", module: "listening", route: "/listening/answer-check", questions: exam.QUESTIONS.filter((q) => q.part < 3), count: 31, max: "153.45" },
  { name: "Listening Part 3", module: "listening", route: "/listening/answer-check/part-3", questions: exam.QUESTIONS.filter((q) => q.part === 3), count: 39, max: "193.05" },
  { name: "Listening Part 4", module: "listening", route: "/listening/answer-check/part-4", questions: exam.QUESTIONS.filter((q) => q.part === 4), count: 30, max: "148.5" },
  { name: "Reading Part 5", module: "reading", route: "/reading/answer-check", questions: reading.READING_QUESTIONS.filter((q) => q.part === 5), count: 30, max: "148.5" },
  { name: "Reading Part 6", module: "reading", route: "/reading/answer-check/part-6", questions: reading.READING_QUESTIONS.filter((q) => q.part === 6), count: 16, max: "79.2" },
  { name: "Reading Part 7", module: "reading", route: "/reading/answer-check/part-7", questions: reading.READING_QUESTIONS.filter((q) => q.part === 7), count: 54, max: "267.3" },
];
