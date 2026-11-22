import re

text = open("docs/extracted/reading_clean.md", encoding="utf-8").read()
parts = re.split(r"(?m)^\*\*(\d+)\.\*\*", text)
b = parts[2]
for pat in [r"\*\*[^\n]*?:\*\*\s*([A-D])", r":\*\*\s*([A-D])", r"\*\*\s*([A-D])", r"([A-D])"]:
    m = re.search(pat, b)
    print(pat, bool(m), m.group(1) if m else None)
