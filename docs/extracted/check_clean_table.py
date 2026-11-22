import io, json, re

text = io.open("docs/extracted/reading_clean.md", encoding="utf-8").read()
lines = text.splitlines()
key = json.load(open("docs/extracted/reading_answer_key.json", encoding="utf-8"))
table = {}
for line in lines:
    if not line.startswith("| ") or line.startswith("|---"):
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) != 10:
        continue
    try:
        ids = [int(c) for c in cells]
    except ValueError:
        continue
    # this is a header row; the next non-separator row holds answers
    continue

# simpler: parse triples of header/separator/values
i = 0
while i < len(lines):
    if lines[i].startswith("| ") and i + 2 < len(lines) and set(lines[i + 1].replace("|", "").replace("-", "").strip()) == set():
        headers = [c.strip() for c in lines[i].strip().strip("|").split("|")]
        values = [c.strip() for c in lines[i + 2].strip().strip("|").split("|")]
        if len(headers) == 10 and all(h.isdigit() for h in headers) and len(values) == 10:
            for h, v in zip(headers, values):
                table[h] = v
        i += 3
    else:
        i += 1

diff = [(k, table.get(k), v) for k, v in key.items() if table.get(k) != v]
print("table entries", len(table))
print("diff", diff)
