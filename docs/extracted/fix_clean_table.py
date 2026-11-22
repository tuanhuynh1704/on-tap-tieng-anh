import io, json, re

path = "docs/extracted/reading_clean.md"
text = io.open(path, encoding="utf-8").read()
lines = text.splitlines()
key = json.load(open("docs/extracted/reading_answer_key.json", encoding="utf-8"))

# Rebuild every quick-check values row from the authoritative JSON.
i = 0
fixed = 0
while i < len(lines):
    if lines[i].startswith("| ") and i + 2 < len(lines):
        headers = [c.strip() for c in lines[i].strip().strip("|").split("|")]
        sep = lines[i + 1]
        values = [c.strip() for c in lines[i + 2].strip().strip("|").split("|")]
        if (
            len(headers) == 10
            and all(h.isdigit() for h in headers)
            and len(values) == 10
            and set(sep.replace("|", "").replace("-", "").strip()) == set()
        ):
            new_values = [key[h] for h in headers]
            lines[i + 2] = "| " + " | ".join(new_values) + " |"
            fixed += 1
        i += 3
    else:
        i += 1

io.open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
print("rows rebuilt", fixed)
