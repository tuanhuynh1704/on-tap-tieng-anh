import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const c = await CDP.connect();
await c.setViewport(1440, 900, false);
await c.navigate("http://localhost:3000/reading/review");
await c.waitFor(`document.getElementById('rq-1') !== null`, 60000);
await sleep(300);

const out = {};
out.before = await c.eval(`(()=>({
  key:localStorage.getItem('cdr.reading.mastered.v1'),
  btn:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.textContent.trim(),
  pressed:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.getAttribute('aria-pressed')
}))()`);
out.click = await c.eval(`(()=>{
  const b=document.getElementById('rq-1').querySelector('button[aria-pressed]');
  if(!b) return {ok:false}; b.click(); return {ok:true,text:b.textContent.trim()};
})()`);
await sleep(300);
out.after = await c.eval(`(()=>({
  key:localStorage.getItem('cdr.reading.mastered.v1'),
  btn:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.textContent.trim(),
  pressed:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.getAttribute('aria-pressed')
}))()`);
await c.reload();
await c.waitFor(`document.getElementById('rq-1') !== null`, 60000);
await sleep(300);
out.afterReload = await c.eval(`(()=>({
  key:localStorage.getItem('cdr.reading.mastered.v1'),
  btn:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.textContent.trim(),
  pressed:document.getElementById('rq-1').querySelector('button[aria-pressed]')?.getAttribute('aria-pressed')
}))()`);
out.cleanup = await c.eval(`(()=>{
  const k='cdr.reading.mastered.v1'; const raw=localStorage.getItem(k);
  if(!raw) return 'no-key';
  const obj=JSON.parse(raw); const keys=Object.keys(obj);
  if(keys.length===1 && keys[0]==='1') { localStorage.removeItem(k); return 'removed-test-key'; }
  return 'kept-user-data:'+keys.length;
})()`);
fs.writeFileSync("docs/extracted/recheck2.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
c.close();
