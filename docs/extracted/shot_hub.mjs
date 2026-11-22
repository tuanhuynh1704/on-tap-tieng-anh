import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const c = await CDP.connect();
await c.setViewport(1200, 1000, false);
c.consoleErrors = [];
c.exceptions = [];
await c.navigate("http://localhost:3000/reading");
await c.waitFor(`document.querySelectorAll('section[aria-label="Cấu trúc đề — 3 Part"] h3').length === 3`, 60000);
await new Promise((r) => setTimeout(r, 1800));

const result = await c.eval(`(()=>{
  const sec=document.querySelector('section[aria-label="Cấu trúc đề — 3 Part"]');
  const cards=[...sec.querySelectorAll(':scope > div > div')];
  return {
    badges:cards.map(x=>x.querySelector('span')?.textContent.trim()),
    headings:cards.map(x=>x.querySelector('h3')?.textContent.trim()),
    overflow:cards.map(x=>{const s=x.querySelector('span').getBoundingClientRect();const h=x.querySelector('h3').getBoundingClientRect();return {badgeBottom:Math.round(s.bottom),headingTop:Math.round(h.top),overlap:s.bottom>h.top};}),
    scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth
  };
})()`);

const path = "reading-hub-fixed.png";
await c.screenshot(path);
fs.writeFileSync("docs/extracted/hub_check.json", JSON.stringify({
  result,
  errors: c.consoleErrors,
  exceptions: c.exceptions.slice(0, 2),
  screenshot: path,
}, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log("errors", c.consoleErrors.length, "exceptions", c.exceptions.length);
c.close();
