import re, json, io

raw = io.open("docs/extracted/reading_test_raw.md", encoding="utf-8").read()
src = io.open("src/data/reading.ts", encoding="utf-8").read()

PAGE = re.compile(r"={20} PAGE \d+ ={20}")


def norm(s: str) -> str:
    s = re.sub(r"\{\{(\d+)\}\}", r"[BLANK\1]", s)
    s = re.sub(r"_{2,}\s*\((\d+)\)", r"[BLANK\1]", s)   # raw Part 6: ______(31)
    s = re.sub(r"-{2,}\s*(\d+)\s*-{2,}", r"[BLANK\1]", s)
    s = s.replace("\u200b", "").replace("\ufeff", "")
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2014", "-").replace("\u2013", "-")
    s = s.replace("\u00a0", " ").replace("\u2003", " ").replace("\u2002", " ")
    s = s.replace("\u25cf", "*")
    s = PAGE.sub(" ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()


raw_n = norm(raw)

lits = re.findall(r'"((?:[^"\\]|\\.)*)"', src)
decoded = []
for l in lits:
    try:
        decoded.append(json.loads('"' + l + '"'))
    except Exception:
        decoded.append(l)

missing = []
for l in decoded:
    if len(l) < 20:
        continue
    if norm(l) in raw_n:
        continue
    missing.append(l)

with io.open("docs/extracted/audit_reading_text_report3.txt", "w", encoding="utf-8") as f:
    f.write(f"missing after normalization: {len(missing)}\n\n")
    for m in missing:
        f.write("- " + m.replace("\n", " ") + "\n")

print("missing", len(missing))
