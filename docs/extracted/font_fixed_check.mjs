import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const c = await CDP.connect();
await c.setViewport(1200, 1000, false);
const out = { pages: {}, errors: [] };
for (const [name, url, ready] of [
  ["hub", "/reading", `document.querySelectorAll('h3').length >= 3`],
  ["home", "/", `document.body.innerText.includes('TOEIC REVISION')`],
  ["review", "/reading/review", `document.body.innerText.includes('Toàn bộ 100 câu')`],
]) {
  c.consoleErrors = [];
  c.exceptions = [];
  await c.navigate("http://localhost:3000" + url);
  await c.waitFor(ready, 60000);
  await new Promise((r) => setTimeout(r, 1800));
  const shot = `font-fixed-${name}.png`;
  await c.screenshot(shot);
  out.pages[name] = {
    shot,
    errors: c.consoleErrors.length,
    exceptions: c.exceptions.length,
    headingFont: await c.eval(`getComputedStyle(document.querySelector('h1,h2,h3')).fontFamily`),
  };
}
fs.writeFileSync("docs/extracted/font_fixed_check.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
c.close();
