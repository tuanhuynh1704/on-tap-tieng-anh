import re, json

text = open("docs/extracted/reading_clean.md", encoding="utf-8").read()
parts = re.split(r"(?m)^\*\*(\d+)\.\*\*", text)
pairs = {}
for i in range(1, len(parts), 2):
    qid = str(int(parts[i]))
    m = re.search(r"\*\*[^\n]*?:\*\*\s*([A-D])", parts[i + 1])
    if m:
        pairs[qid] = m.group(1)

key = json.load(open("docs/extracted/reading_answer_key.json", encoding="utf-8"))
diff = [(k, pairs.get(k), v) for k, v in key.items() if pairs.get(k) != v]
print("parsed", len(pairs))
print("diff count", len(diff))
print(diff)
