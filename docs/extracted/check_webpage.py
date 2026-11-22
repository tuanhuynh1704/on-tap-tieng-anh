import io

t = io.open("src/data/reading.ts", encoding="utf-8").read()
i = t.find("We hope you will join us")
print(ascii(t[i - 500 : i + 300]))
