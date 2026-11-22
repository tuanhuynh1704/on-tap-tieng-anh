import json, io

d = json.load(open("docs/extracted/report.json", encoding="utf-8"))
keys = ["submitAndResults", "reviewChecks", "listeningChecks", "homeChecks", "otherRoutes", "uiIssues"]
with io.open("docs/extracted/report_summary.txt", "w", encoding="utf-8") as f:
    for k in keys:
        f.write("=== " + k + "\n")
        f.write(json.dumps(d.get(k), ensure_ascii=True, indent=1) + "\n\n")
print("written")
