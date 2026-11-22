import re, json

text = open("docs/extracted/reading_clean.md", encoding="utf-8").read()
i = text.find("p \u00e1n")
print("found at", i)
print("codepoints", [hex(ord(c)) for c in text[i - 8 : i + 6]])
print("raw repr", ascii(text[i - 10 : i + 8]))

# inspect the first block
parts = re.split(r"(?m)^\*\*(\d+)\.\*\*", text)
print("parts", len(parts))
print("block1", ascii(parts[2][:200]))
