import { spawn } from "node:child_process";

const child = spawn("npm.cmd", ["run", "start", "--", "-p", "3211"], {
  cwd: process.cwd(),
  detached: true,
  stdio: "ignore",
  shell: true,
});
child.unref();
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch("http://127.0.0.1:3211/reading");
    if (r.ok) {
      console.log("ready", r.status, "pid", child.pid);
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
