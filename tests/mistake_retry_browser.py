"""Run with an existing Chrome + Python Playwright: py -3.12 tests/mistake_retry_browser.py.

Serve the app separately on loopback: node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3417
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
START = "Làm lại câu sai"
MISSES = {"listening": [1, 2, 32, 33, 63, 66], "reading": [31, 32, 47, 48, 53, 54]}
FEEDBACK = re.compile(r"Đáp án(?: đúng| của bạn)?\s*:|Đã sửa đúng|Sai \(bạn chọn|^Đúng$|^Sai$", re.I | re.M)


def fixture():
    spec = (ROOT / "specs/on-tap-ta-cdr-prd.md").read_text(encoding="utf-8")
    keys = {
        "listening": dict(re.findall(r"\b(\d{1,3})([A-D])\b", spec)),
        "reading": json.loads((ROOT / "docs/extracted/reading_answer_key.json").read_text(encoding="utf-8")),
    }
    storage = {}
    for section, key in keys.items():
        assert set(key) == set(map(str, range(1, 101)))
        prefix = "cdr" if section == "listening" else "cdr.reading"
        parts = [(1, 6), (2, 25), (3, 39), (4, 30)] if section == "listening" else [(5, 30), (6, 16), (7, 54)]
        history = []
        for attempt_id, misses in [("mixed", MISSES[section]), ("single", MISSES[section][:1]), ("perfect", [])]:
            answers = key.copy()
            for i, q in enumerate(misses):
                if i % 2:
                    answers[str(q)] = "B" if key[str(q)] == "A" else "A"
                else:
                    del answers[str(q)]
            per_part, offset = [], 0
            for part, total in parts:
                correct = total - sum(offset < q <= offset + total for q in misses)
                per_part.append({"part": part, "correct": correct, "total": total})
                offset += total
            raw = 100 - len(misses)
            history.append(dict(id=attempt_id, date=1700000000000 + len(history), answers=answers,
                                raw=raw, scaled=raw * 4.95, perPart=per_part))
        storage[f"{prefix}.history.v1"] = json.dumps(history)
        storage[f"{prefix}.draft.v1"] = json.dumps(dict(answers={"8": "B"}, flags=[9], savedAt=1700000000000))
        storage[f"{prefix}.mastered.v1"] = '{"12":true}'
    return keys, storage


def events(page):
    # Inspect the real SDK queue; never load the remote analytics consumer.
    return page.evaluate("""() => (window.vaq ?? []).filter(([kind]) => kind === 'event')
        .map(([, {name, data}]) => [name, data])""")


def verify_materials(dialog, section, selected):
    if section == "reading":
        for text in ("Keep Cool Service Contractors can bring you peace of mind", "My schedule next week",
                     "Thank you for reserving a River Thames tour", "Tours cannot be rescheduled."):
            expect(dialog.get_by_text(text, exact=False).first).to_be_visible()
        return
    images = dialog.locator("img")
    expected = [f"/exam/q{q:02d}.png" if q < 3 else f"/exam/graphic-q{q}.png" for q in selected if q in (1, 2, 63, 66)]
    expect(images).to_have_count(len(expected))
    actual = []
    for image in images.all():
        image.scroll_into_view_if_needed()
        image.evaluate("async img => { await img.decode(); if (!img.naturalWidth) throw Error('empty image'); }")
        actual.append(unquote(image.evaluate("img => img.currentSrc")))
        assert image.get_attribute("alt"), "image lacks a description"
    assert all(any(path in url for url in actual) for path in expected), (expected, actual)
    expect(dialog.get_by_role("button", name="Nghe câu hỏi").first).to_be_visible()
    expect(dialog.get_by_role("button", name="Nghe đoạn hội thoại hoặc bài nói").first).to_be_visible()
    for ids, title, content in [((32, 33), "32–34", "overseas marketing launch"),
                                 ((63,), "62–64", "booked your plane tickets"),
                                 ((66,), "65–67", "city museum today")]:
        if set(ids) & set(selected):
            details = dialog.locator("details").filter(has=dialog.page.get_by_text(f"Xem transcript: Questions {title}", exact=True))
            details.locator("summary").click()
            expect(details.get_by_text(content, exact=False)).to_be_visible()
            assert not re.search(r"\(\d{1,3}\)", details.inner_text()), "transcript exposes numbered answer cues"


def run_case(page, section, width, key, storage, origin):
    route = "/results" if section == "listening" else "/reading/results"
    cta = page.get_by_role("button", name=START, exact=True)
    dialog = page.get_by_role("dialog", name=START, exact=True)
    for attempt, total in [("perfect", 0), ("single", 1), ("mixed", 5)]:
        url = f"{origin}{route}?id={attempt}"
        response = page.goto(url, wait_until="domcontentloaded", timeout=90000)
        assert response.status == 200, response.status
        raw = {"perfect": 100, "single": 99, "mixed": 94}[attempt]
        score = page.get_by_role("img", name=f"Điểm raw {raw} trên 100", exact=True)
        expect(score).to_be_visible(timeout=20000)
        scaled = page.get_by_text(f"{raw * 4.95:g} / 495", exact=True)
        expect(scaled).to_be_visible()
        assert events(page) == []
        if not total:
            expect(cta).to_have_count(0)
            continue
        cta.click()
        expect(dialog).to_be_visible()
        assert dialog.evaluate("el => el instanceof HTMLDialogElement && el.matches(':modal')")
        groups = dialog.get_by_role("group", name=re.compile(r"^Câu\s+\d+", re.I))
        expect(groups).to_have_count(total)
        selected = [int(re.search(r"Câu\s+(\d+)", group.locator("legend").inner_text(), re.I)[1]) for group in groups.all()]
        eligible = MISSES[section] if total == 5 else MISSES[section][:1]
        assert set(selected) <= set(eligible) and len(set(selected)) == total, (eligible, selected)
        start = ["mistake_retry_started", dict(section=section, total=total)]
        assert events(page) == [start]
        expect(dialog.locator("input:checked")).to_have_count(0)
        if total == 1:
            groups.first.get_by_role("radio").first.check()
            page.keyboard.press("Escape")
            expect(dialog).to_have_count(0)
            expect(cta).to_be_focused()
            cta.click()
            expect(dialog.locator("input:checked")).to_have_count(0)
            dialog.get_by_role("button", name="Đóng", exact=True).click()
            expect(dialog).to_have_count(0)
            expect(cta).to_be_focused()
            assert events(page) == [start, start]
        else:
            verify_materials(dialog, section, selected)
            assert dialog.evaluate("el => el.scrollWidth <= el.clientWidth + 1"), "horizontal overflow"
            submit = dialog.get_by_role("button", name="Chấm bài", exact=True)
            submit.click()
            expect(groups).to_have_count(total)
            assert events(page) == [start], "incomplete retry was recorded as complete"
            answers = {}
            for i, (q, group) in enumerate(zip(selected, groups.all(), strict=True)):
                right = key[str(q)]
                chosen = right if i < 3 else ("B" if right == "A" else "A")
                radios = group.get_by_role("radio")
                expect(radios).to_have_count(4)
                colors = radios.evaluate_all("""els => els.map(el => {
                    const s = getComputedStyle(el.labels[0]); return [s.color,s.backgroundColor,s.borderColor].join('|'); })""")
                assert len(set(colors)) == 1, f"Q{q} options have different colors before answering"
                group.get_by_role("radio", name=re.compile(rf"^{chosen}\.\s")).check()
                answers[q] = chosen
            assert not FEEDBACK.search(dialog.inner_text()), "correctness text visible before submit"
            submit.click()
            heading = dialog.get_by_role("heading", name="Đã sửa đúng 3/5 câu", exact=True)
            expect(heading).to_be_visible()
            for q, chosen in answers.items():
                row = dialog.get_by_role("listitem").filter(has_text=f"Câu {q}:")
                expect(row).to_contain_text(f"Đáp án: {key[str(q)]}.")
                expect(row).to_contain_text("Đúng" if chosen == key[str(q)] else f"Sai (bạn chọn {chosen})")
            assert events(page) == [start, ["mistake_retry_completed", dict(section=section, total=5, corrected=3)]]
            dialog.get_by_role("button", name="Về kết quả bài gốc", exact=True).click()
            expect(dialog).to_have_count(0)
            expect(cta).to_be_focused()
        expect(page).to_have_url(url)
        expect(score).to_be_visible()
        expect(scaled).to_be_visible()
        assert page.evaluate("() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('cdr.')))") == storage
    print(f"PASS {section} {width}px: perfect, single cancel/reopen, mixed {selected} -> 3/5", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=3417)
    parser.add_argument("--channel", default="chrome", choices=["chrome", "msedge", "chromium"])
    args = parser.parse_args()
    origin = f"http://127.0.0.1:{args.port}"
    keys, storage = fixture()
    state = {"cookies": [], "origins": [{"origin": origin, "localStorage": [{"name": k, "value": v} for k, v in storage.items()]}]}
    with sync_playwright() as pw, pw.chromium.launch(channel=args.channel) as browser:
        print(f"{args.channel} {browser.version}", flush=True)
        for width, height in [(1280, 900), (375, 812)]:
            for section in MISSES:
                with browser.new_context(viewport=dict(width=width, height=height), has_touch=width < 600,
                                         is_mobile=width < 600, reduced_motion="reduce", storage_state=state,
                                         service_workers="block") as context:
                    context.route("**/*", lambda r: r.continue_() if urlsplit(r.request.url).netloc == urlsplit(origin).netloc
                                  and not urlsplit(r.request.url).path.startswith("/_vercel/") else r.abort())
                    page = context.new_page()
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    run_case(page, section, width, keys[section], storage, origin)
                    assert not errors, errors
