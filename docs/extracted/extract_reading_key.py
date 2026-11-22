import fitz, re, json

doc = fitz.open("docs/READING REVISION - ANSWER KEY.pdf")
spans = []
for p in doc:
    d = p.get_text("dict")
    for b in d["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if s["color"] in (16711680, 15597568):
                    spans.append(s["text"])
letters = re.findall(r"\(([A-D])\)", "".join(spans))
assert len(letters) == 100, len(letters)

data = {str(i + 1): l for i, l in enumerate(letters)}
with open("docs/extracted/reading_answer_key.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

lines = [
    "# READING REVISION — Answer key (trich tu PDF dap an, chu do)",
    "",
    "Nguon: docs/READING REVISION - ANSWER KEY.pdf — 100/100 cau.",
    "",
    "| Cau | DA | Cau | DA | Cau | DA | Cau | DA |",
    "|---|---|---|---|---|---|---|---|",
]
for r in range(25):
    row = []
    for c in range(4):
        i = r + 1 + c * 25
        row += [str(i), letters[i - 1]]
    lines.append("| " + " | ".join(row) + " |")
with open("docs/extracted/reading_answer_key.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print("ok")
print("Part5", "".join(letters[:30]))
print("Part6", "".join(letters[30:46]))
print("Part7", "".join(letters[46:]))
