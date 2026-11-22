import re, json, io

raw = open("docs/extracted/reading_test_raw.md", encoding="utf-8").read()
src = open("src/data/reading.ts", encoding="utf-8").read()

def norm(s: str) -> str:
    s = s.replace("{{", "______(").replace("}}", ")")
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2014", "-").replace("\u2013", "-")
    s = s.replace("\u00a0", " ").replace("\u2003", " ").replace("\u2002", " ")
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
lits = [l for l in decoded if len(l) >= 20]

missing = [l for l in lits if norm(l) not in raw_n]

with io.open("docs/extracted/audit_reading_text_report.txt", "w", encoding="utf-8") as f:
    f.write(f"literals >=20 chars: {len(lits)}\nmissing: {len(missing)}\n\n")
    for m in missing:
        f.write("- " + m.replace("\n", " ") + "\n")

print("literals", len(lits), "missing", len(missing))
