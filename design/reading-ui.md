# Reading UI — quyết định thiết kế

Bổ sung cho `design/ui-upgrade.md`. Module Reading dùng **cùng design system** (giấy ngà, teal, gold, display serif, motion tokens) và cùng pattern điều hướng/answers đã có. Không tạo ngôn ngữ thị giác mới.

## 1. Thương hiệu & điều hướng

- Trang chủ đổi wordmark thành **TOEIC REVISION** (monogram **TR**), phụ đề `LISTENING · READING · 28/11/2026`.
- `SiteHeader` dùng chung:
  - `Trang chủ` (`/`)
  - `Listening` (`/practice`) — active với `/practice`, `/results`, `/review`
  - `Reading` (`/reading`) — active với mọi route `/reading/*`
- Các trang Listening giữ eyebrow `LISTENING REVISION · 28/11/2026`; trang Reading dùng `READING REVISION · 28/11/2026`.
- Trang practice (cả 2 module) có link nhỏ “Ôn tập” cạnh brand để vào review tương ứng.

## 2. Trang chủ (2 module)

- Hero: eyebrow `TOEIC · LISTENING & READING`, H1 `TOEIC REVISION.`, phụ đề “Luyện trọn bộ 200 câu Listening + Reading — làm lại nhiều lần, theo dõi tiến bộ.”
- Bên phải: bìa đề kép hoặc bìa chung ghi `LISTENING · 45 MIN` / `READING · 75 MIN`.
- Section “Chọn bài luyện” gồm 2 card lớn (grid `lg:grid-cols-2`):
  - **Listening** — 100 câu · 45 phút · Part I–IV; CTA amber “Làm Listening”; link viền “Ôn tập & đáp án” → `/review`.
  - **Reading** — 100 câu · 75 phút · Part 5–7; CTA amber “Làm Reading”; link viền “Ôn tập & đáp án” → `/reading/review`.
  - Card có icon SVG (headphone / book), list cấu trúc Part, hover lift.
- Stats: segmented control `Listening | Reading`; hiển thị attempts / best / avg / câu sai nhiều nhất của module đang chọn. Nút xoá lịch sử của module đó.
- Giữ section “Ví dụ minh hoạ — PART I” (Listening) ở dưới; có thể thêm card “Reading Part 5 — ví dụ” nhỏ nếu bố cục cân.
- Footer: `TOEIC REVISION · 28/11/2026` + disclaimer ước lượng cho cả 2 điểm.

## 3. Reading hub `/reading`

- Hero ngắn: eyebrow `TOEIC · READING PRACTICE`, H1 `READING REVISION.`, mô tả 100 câu / 75 phút / 3 Part, CTA “Bắt đầu làm bài” + “Ôn tập & đáp án”.
- Thẻ cấu trúc 3 Part: Part 5 (30 câu, điền từ), Part 6 (16 câu, hoàn thành đoạn), Part 7 (54 câu, đọc hiểu; single/double/triple).
- Panel thống kê Reading (attempts, best, avg, câu sai nhiều nhất) + nút xoá lịch sử Reading.
- Ghi chú: “Điểm quy đổi Reading 5–495 là ước lượng, không phải điểm ETS chính thức.”

## 4. Reading practice

### Header
- Sticky, cao ~56px như practice Listening.
- Trái: monogram `TR` + `READING REVISION` + link “Ôn tập”.
- Giữa: đồng hồ `75:00` (font-display, tabular; đỏ khi ≤ 5 phút) + nút Tắt/Bật giờ.
- Phải: trạng thái autosave + nút “Nộp bài” amber.
- Không có nút tốc độ đọc/TTS.

### Bố cục
- Desktop: `grid lg:grid-cols-[minmax(0,1fr)_400px]`, sidebar navigator sticky.
- Nội dung: từng Part có sticky part header (`Part 5 · Điền từ/cụm từ · Câu 1–30` + mô tả ngắn).
- Part 5: câu hỏi card, số câu ô teal, prompt đậm, options A–D.
- Part 6/7: mỗi bộ gồm **document card** + danh sách question card.
  - Document card: `rounded-2xl border border-line bg-white shadow-card`, padding 16–24px, typography đọc thoáng.
  - Intro line (“Questions 31–34 refer to the following advertisement.”) in nghiêng, nhỏ, phía trên.
  - Nếu nhiều tài liệu: mỗi tài liệu có nhãn nhỏ (Email / Article / Notice / Survey response / Report summary / Text message) và divider giữa các tài liệu.
- Mobile: document card full width; question cards bên dưới; bottom bar hiển thị tiến độ + nút “Bảng câu hỏi”.

### Document styles
- **Email**: header dạng bảng nhãn `To/From/Date/Subject` (nhãn in hoa nhỏ, giá trị đậm vừa), divider, body paragraph.
- **Chat**: từng dòng `Tên [giờ]` đậm + nội dung; xen kẽ nền `paper` rất nhạt để dễ tách.
- **Article/Notice/Ad**: tiêu đề serif nhỏ (không dùng serif quá lớn trong khung đọc), đoạn văn 15px/1.75.
- **List**: bullet `•` hoặc số; giữ đúng thứ tự.
- **Table** (receipt): header `Item/Cost`, hàng tabular, tổng đậm; wrapper `overflow-x-auto`.
- **Box** (text message, reservation): nền `paper-deep/60`, border `line`, bo 12px, nhãn nhỏ phía trên.
- **Quote**: viền trái 3px gold, nền `accent-soft/30`, attribution in nghiêng.

### Chỗ trống & marker
- Part 6 blank `{{31}}` → chip inline: `rounded-md border border-brand/40 bg-brand-soft px-1.5 py-0.5 text-[12px] font-bold text-brand-dark`, hiển thị `31` hoặc chữ cái đã chọn (`31 · B`). Click → scroll tới câu 31 và focus ring.
- Part 7 marker `[1]`–`[4]` → chip nhỏ `bg-paper-deep text-ink` (không tương tác), giữ đúng vị trí trong câu.
- Không làm thay đổi ngắt dòng/đoạn gốc.

### Câu hỏi
- Card giống Listening nhưng gọn hơn: số câu + `Part n` + nút cờ; prompt; 4 option.
- Với câu hỏi vị trí `[1]–[4]`, hiển thị prompt nguyên văn; không thêm UI chọn vị trí.
- Option selected: teal fill nhẹ + chip chữ cái teal + pop animation (giữ như Listening).

### Navigator
- `QuestionPanel` tái sử dụng, nhận dữ liệu Reading.
- Part headers: `P5 · Điền từ`, `P6 · Đoạn văn`, `P7 · Đọc hiểu`.
- Lưới 10 cột, ô vuông `rounded-md`, gap 4px, chữ 12px; Part 5 = 30 ô, Part 6 = 16, Part 7 = 54.
- Legend giữ nguyên: Chưa làm / Đã chọn / Đã cờ.

## 5. Reading results

- Cùng bố cục Results Listening: eyebrow, H1 serif, ScoreRing, điểm 5–495, delta, disclaimer.
- Breakdown 3 Part + “Cần ôn nhất”.
- Chi tiết câu:
  - Part 5: danh sách câu độc lập.
  - Part 6/7: nhóm theo passage; mỗi nhóm có heading `Questions 31–34 · Advertisement`.
  - Accordion “Xem đoạn văn” **mặc định đóng**; mở ra render document card (read-only, không chip tương tác).
  - Câu hỏi hiển thị ngay dưới heading nhóm (kể cả khi đoạn đang đóng) để so đáp án nhanh.
- Filter segmented `Chỉ câu sai / Tất cả`; nếu lọc sai, nhóm chỉ hiện câu sai nhưng vẫn giữ heading nhóm.
- Empty state: “Tuyệt vời — bạn không sai câu nào!”

## 6. Reading review

- Cùng ngôn ngữ với Review Listening: tiêu đề serif, search, segmented filter, accordion.
- Part 5: 30 card câu hỏi (đáp án xanh, toggle “Đã nắm”).
- Part 6/7: accordion theo passage, **mặc định mở**; bên trong là document card + các câu hỏi có đáp án đúng + toggle “Đã nắm”.
- Search tìm cả nội dung đoạn văn (email, article, chat, table) và options.
- Bảng top 10 câu sai nhiều nhất từ Reading history.
- Nút xoá lịch sử Reading (confirm) — không xoá Listening.

## 7. Motion & accessibility

- Vào trang: `animate-fade-up` với stagger 60–120ms cho hero/card; accordion dùng grid-rows transition; hover lift trên card.
- `prefers-reduced-motion`: tắt toàn bộ animation/transition (đã có global rule).
- Focus-visible rõ trên chip blank, marker không tương tác, option, navigator.
- Document text là nội dung chính: không đặt trong vùng `aria-hidden`; heading đúng cấp (h2/h3).
- Không emoji, icon SVG inline, không dependency mới.
