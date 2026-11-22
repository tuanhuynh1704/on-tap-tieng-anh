import io

t = io.open("src/data/reading.ts", encoding="utf-8").read()
for s in [
    "Questions 76",
    "Questions 91",
    "Questions 96",
    "Director of Mobile Banking, Ogden Bank",
    "https://www.westwoodlibrary.org/bookclub",
    "We hope you will join us",
    "Book club — Westwood Library",
]:
    i = t.find(s)
    print(s, "=", ascii(t[i:i + 220]) if i >= 0 else "NOT FOUND")
