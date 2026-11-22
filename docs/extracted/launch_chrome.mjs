import { spawn } from "node:child_process";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const args = [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--user-data-dir=C:\\Users\\nkocn\\AppData\\Local\\Temp\\opencode\\cdp-chrome3",
  "about:blank",
];
const child = spawn(chrome, args, { detached: true, stdio: "ignore" });
child.unref();
for (let i = 0; i < 20; i++) {
  try {
    const r = await fetch("http://127.0.0.1:9222/json/list");
    const j = await r.json();
    console.log("ready", j.map((t) => t.type));
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 300));
  }
}
