import { CDP } from "./cdp.mjs";

const c = await CDP.connect();
await c.setViewport(1200, 1000, false);
c.consoleErrors = [];
c.exceptions = [];
await c.navigate("http://localhost:3000/reading");
await c.waitFor(`document.querySelectorAll('h3').length >= 3`, 60000);
await new Promise((r) => setTimeout(r, 1500));

const before = await c.eval(`(()=>{
  const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('Part 5'));
  return {text:h?.textContent, font:getComputedStyle(h).fontFamily, width:h?.getBoundingClientRect().width};
})()`);
await c.eval(`document.querySelectorAll('.font-display').forEach(e=>e.style.fontFamily='"Segoe UI", system-ui, sans-serif')`);
await new Promise((r) => setTimeout(r, 300));
const after = await c.eval(`(()=>{
  const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('Part 5'));
  return {text:h?.textContent, font:getComputedStyle(h).fontFamily, width:h?.getBoundingClientRect().width};
})()`);
await c.screenshot("reading-hub-font-test.png");
console.log(JSON.stringify({ before, after, errors: c.consoleErrors.length }, null, 2));
c.close();
