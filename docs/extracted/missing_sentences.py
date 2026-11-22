import re, io

raw = io.open("docs/extracted/reading_test_raw.md", encoding="utf-8").read()
src = io.open("src/data/reading.ts", encoding="utf-8").read()
PAGE = re.compile(r"={20} PAGE \d+ ={20}")


def norm(s: str) -> str:
    s = re.sub(r"\{\{(\d+)\}\}", r"[BLANK\1]", s)
    s = re.sub(r"_{2,}\s*\((\d+)\)", r"[BLANK\1]", s)
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


src_n = norm(src)
raw_n = norm(raw)

# Split source into sentences, keep long ones (likely real content)
sentences = re.split(r"(?<=[.!?])\s+", raw_n)
missing = []
for s in sentences:
    s = s.strip()
    if len(s) < 45:
        continue
    # skip directions and question/option lines (start with letter markers or question numbers)
    if re.match(r"^\(?[a-d]\)", s):
        continue
    if re.match(r"^\d+\.", s):
        continue
    if s.startswith(("part ", "directions:", "questions ")):
        continue
    if s not in src_n:
        missing.append(s)

with io.open("docs/extracted/missing_sentences.txt", "w", encoding="utf-8") as f:
    f.write(f"missing sentences: {len(missing)}\n\n")
    for m in missing:
        f.write("- " + m + "\n")

print("missing sentences", len(missing))
