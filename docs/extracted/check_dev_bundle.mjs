// Diagnostic: does the running dev server on :3000 serve the new practice code?
const BASE = "http://localhost:3000";
const html = await (await fetch(BASE + "/practice")).text();
console.log("status", html.length > 0 ? 200 : 0, "len", html.length);
console.log("hasIsoInHtml", html.includes("useIsomorphicLayoutEffect"));
console.log("hasCommentInHtml", html.includes("Đối chiếu draft"));
const srcs = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
console.log("scripts", srcs.length);
let found = 0;
for (const s of srcs) {
  try {
    const u = s.startsWith("http") ? s : BASE + s;
    const t = await (await fetch(u)).text();
    if (
      t.includes("useIsomorphicLayoutEffect") ||
      t.includes("hasDraftContent") ||
      t.includes("freshResetRef") ||
      t.includes("selectAnswer") ||
      t.includes("Đối chiếu draft")
    ) {
      found++;
      console.log("FOUND_IN", u, "len", t.length);
    }
  } catch {}
}
console.log("found", found);
