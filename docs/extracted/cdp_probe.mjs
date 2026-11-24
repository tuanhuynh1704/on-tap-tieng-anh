import { CDP } from "./cdp.mjs";
const c = await CDP.connect();
console.log(await c.eval(`JSON.stringify({href:location.href,origin:location.origin,ready:document.readyState,title:document.title,body:(document.body?document.body.innerText.slice(0,200):null)})`));
c.close();
