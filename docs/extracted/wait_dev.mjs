for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch("http://localhost:3000/");
    if (r.ok) {
      console.log("DEV_UP", r.status);
      process.exit(0);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
console.log("DEV_DOWN");
process.exit(1);
