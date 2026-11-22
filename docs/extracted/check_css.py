import glob, io, re

for f in glob.glob(".next/**/*.css", recursive=True):
    t = io.open(f, encoding="utf-8", errors="ignore").read()
    for m in re.finditer(r"[^}]{0,120}\.font-display[^}]{0,300}\}", t):
        print(f, "->", m.group(0)[:400])
