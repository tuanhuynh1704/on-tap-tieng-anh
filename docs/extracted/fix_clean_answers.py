import io

path = "docs/extracted/reading_clean.md"
lines = io.open(path, encoding="utf-8").read().splitlines()

# 1-based line numbers verified by inspection
fixes = {92: "B", 158: "B", 535: "B"}
for ln, letter in fixes.items():
    idx = ln - 1
    assert lines[idx].startswith("**\u0110\u00e1p \u00e1n:**"), (ln, ascii(lines[idx]))
    lines[idx] = "**\u0110\u00e1p \u00e1n:** " + letter

io.open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
print("fixed", fixes)
