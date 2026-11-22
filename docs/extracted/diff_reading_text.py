import re, io, json, difflib

raw = io.open("docs/extracted/reading_test_raw.md", encoding="utf-8").read()
src = io.open("src/data/reading.ts", encoding="utf-8").read()
PAGE = re.compile(r"={20} PAGE \d+ ={20}")


def norm(s: str) -> str:
    s = re.sub(r"\{\{(\d+)\}\}", r"[BLANK\1]", s)
    s = re.sub(r"_{2,}\s*\((\d+)\)", r"[BLANK\1]", s)
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

targets = [
    "Keep Cool Service Contractors can bring",
    "The position requires a two-year degree",
    "4. More effort could be made",
    "I received my order confirmation e-mail",
]

for t in targets:
    lit = next((x for x in decoded if x.startswith(t)), None)
    if not lit:
        print("NOT FOUND", t)
        continue
    n = norm(lit)
    # find longest prefix present in raw
    lo, hi = 0, len(n)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if n[:mid] in raw_n:
            lo = mid
        else:
            hi = mid - 1
    # locate raw window around matched prefix
    idx = raw_n.find(n[:lo]) if lo else -1
    print("=" * 20, t)
    print("matched prefix len", lo, "of", len(n))
    print("data next 80:", ascii(n[lo:lo + 80]))
    if idx >= 0:
        print("raw  next 80:", ascii(raw_n[idx + lo: idx + lo + 80]))
    print()
