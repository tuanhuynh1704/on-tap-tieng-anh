import re, json

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
needle = norm("Sarah's Catering is a family-owned-and-operated company. The company was founded ten years ago with a mission to provide the highest quality catering services in our community.")
print("needle in raw:", needle in raw_n)
idx = raw_n.find("sarah's catering is a family-owned-and-operated company")
print("raw idx", idx)
print("raw slice", ascii(raw_n[idx:idx+260]))
print("needle   ", ascii(needle[:260]))
