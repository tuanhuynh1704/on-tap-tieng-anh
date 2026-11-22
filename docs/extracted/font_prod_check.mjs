import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const BASE = "http://127.0.0.1:3211";
const c = await CDP.connect();
await c.setViewport(1200, 1000, false);
const out = { pages: {} };
for (const [name, url, ready] of [
  ["hub", "/reading", `document.querySelectorAll('h3').length >= 3`],
  ["home", "/", `document.body.innerText.includes('TOEIC REVISION')`],
  ["review", "/reading/review", `document.body.innerText.includes('Toàn bộ 100 câu')`],
]) {
  c.consoleErrors = [];
  c.exceptions = [];
  await c.navigate(BASE + url);
  await c.waitFor(ready, 60000);
  await new Promise((r) => setTimeout(r, 1600));
  const shot = `font-prod-${name}.png`;
  await c.screenshot(shot);
  out.pages[name] = {
    shot,
    font: await c.eval(`getComputedStyle(document.querySelector('h1,h2,h3')).fontFamily`),
    errors: c.consoleErrors.length,
    exceptions: c.exceptions.length,
  };
}
fs.writeFileSync("docs/extracted/font_prod_check.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
c.close();
