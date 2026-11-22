import re

text = open("docs/extracted/reading_clean.md", encoding="utf-8").read()
parts = re.split(r"(?m)^\*\*(\d+)\.\*\*", text)
print("len parts", len(parts))
print("p1", ascii(parts[1]))
b = parts[2]
print("b start", ascii(b[:80]))
print("has bold", "**" in b)
print("lines with bold", [ascii(x) for x in b.splitlines() if "**" in x][:3])
print("re bold", bool(re.search(r"\*\*", b)))
print("re colon", bool(re.search(r":\*\*", b)))
print("re letter", bool(re.search(r"([A-D])", b)))
