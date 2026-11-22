import re

text = open("docs/extracted/reading_clean.md", encoding="utf-8").read()
parts = re.split(r"(?m)^\*\*(\d+)\.\*\*", text)
block = parts[2]
pat = r"\*\*\u0110\u00e1p \u00e1n:\*\*\s*([A-D])"
print("pattern", ascii(pat))
m = re.search(pat, block)
print("match", m)
print("find", block.find("**\u0110\u00e1p \u00e1n:**"))
print("slice", ascii(block[block.find("**\u0110\u00e1p"):block.find("**\u0110\u00e1p")+30]))
