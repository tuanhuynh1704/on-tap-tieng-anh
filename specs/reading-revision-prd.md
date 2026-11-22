# PRD — Reading Revision (TOEIC Reading 100 câu)

Trạng thái: **đã chốt phạm vi, chờ triển khai**
Ngày: 20/11/2026

Nguồn nội dung:
- `docs/READING REVISION_28.11.2026.pdf` (22 trang) — đề Reading, 100 câu.
- `docs/READING REVISION - ANSWER KEY.pdf` (21 trang) — đáp án tô đỏ.
- Bản text trích xuất: `docs/extracted/reading_test_raw.md`, `docs/extracted/reading_key_raw.md`.
- Đáp án máy đọc: `docs/extracted/reading_answer_key.json` + `.md` (đã verify 100/100, đúng thứ tự câu 1–100).

## 1. Mục tiêu

Bổ sung **module Reading** hoàn chỉnh, song song với Listening hiện có:

- Làm trọn 100 câu Reading trong **75 phút**, làm lại nhiều lần.
- Chấm điểm raw + quy đổi ước lượng Reading **5–495** (ghi rõ không phải điểm ETS).
- Xem kết quả theo Part 5/6/7, xem lại câu sai kèm **đoạn văn gốc**.
- Ôn tập toàn bộ 100 câu, đánh dấu “đã nắm”, tìm kiếm/lọc.
- Toàn bộ nội dung tiếng Anh **giữ nguyên văn** từ PDF; UI tiếng Việt.
- Không backend, không auth, chỉ localStorage; không thêm dependency.

## 2. Cấu trúc đề (bắt buộc giữ đúng)

| Part | Dạng | Câu | Số câu | Điểm đặc biệt |
|---|---|---|---|---|
| 5 | Incomplete Sentences | 1–30 | 30 | Mỗi câu là một câu văn có chỗ trống `------` + 4 lựa chọn |
| 6 | Text Completion | 31–46 | 16 | 4 đoạn (31–34, 35–38, 39–42, 43–46), mỗi đoạn 4 chỗ trống inline |
| 7 | Reading Comprehension | 47–100 | 54 | 15 bộ đoạn đọc: single / double / triple passages |

Tổng: **100 câu**, thời gian **75:00**.

### 15 bộ Part 7 (đúng thứ tự)

| # | Câu | Dạng | Nội dung |
|---|---|---|---|
| 1 | 47–48 | email | Neil Cullen — schedule next week |
| 2 | 49–50 | chat | Michiko Saunders / Jacob Kwon |
| 3 | 51–52 | advertisement | Medillo Shoes |
| 4 | 53–55 | notice + reservation box | River Thames Tours |
| 5 | 56–57 | notice | City of Bryanton Building Permit Office |
| 6 | 58–60 | email có marker [1]–[4] | Kipbank Business Services |
| 7 | 61–63 | article | Waldenstone Corporate Prize / Carila |
| 8 | 64–67 | advertisement có marker [1]–[4] | Commbolt referral |
| 9 | 68–71 | chat | Marcus Steuber / Brinda Rajan / Joshua Borg |
| 10 | 72–75 | article + testimonial quotes | Sarah’s Catering |
| 11 | 76–80 | schedule box + text message box | Rambling River Festival (double) |
| 12 | 81–85 | email + survey response + report | Woolf Flooring (triple) |
| 13 | 86–90 | email + order receipt table + reply email | George Street Sweets (triple) |
| 14 | 91–95 | email + article | Ogden Bank (double) |
| 15 | 96–100 | notice + web page book list + email | Westwood Library (triple) |

## 3. Routes

| Route | Nội dung |
|---|---|
| `/` | Trang chủ chung: giới thiệu 2 module Listening + Reading, thẻ đề, thống kê từng module |
| `/practice` | Listening practice (giữ nguyên hành vi hiện tại) |
| `/results?id=` | Listening results (giữ nguyên) |
| `/review` | Listening review (giữ nguyên) |
| `/reading` | Hub Reading: giới thiệu đề 75 phút, cấu trúc 3 Part, CTA làm bài/ôn tập, thống kê Reading |
| `/reading/practice` | Reading practice 75:00 (mới) |
| `/reading/results?id=` | Reading results (mới) |
| `/reading/review` | Reading review toàn bộ 100 câu (mới) |

Điều hướng chung (`SiteHeader`): `Trang chủ` · `Listening` (`/practice`) · `Reading` (`/reading`).
Review của từng module truy cập từ hub/card, từ header của trang practice (link “Ôn tập”) và CTA ở results.

## 4. Hành vi Practice (Reading)

- Đồng hồ **75:00** đếm ngược, có nút Tắt/Bật giờ; hết giờ **tự nộp**.
- Chọn đáp án A–D, đánh cờ câu hỏi, autosave draft sau mỗi thay đổi.
- Navigator: lưới 10 cột, chia Part 5 / Part 6 / Part 7, hiển thị tiến độ từng Part; bottom sheet trên mobile (giữ pattern hiện có).
- Click câu trong navigator → cuộn tới câu đó.
- Part 5: danh sách câu hỏi như Listening (prompt + 4 options).
- Part 6: mỗi đoạn văn hiển thị **một lần** trong khung tài liệu; các chỗ trống inline hiển thị chip số câu (31, 32, …), click chip → cuộn tới câu hỏi tương ứng. 4 câu hỏi nằm ngay dưới đoạn.
- Part 7: mỗi bộ đoạn hiển thị 1–3 tài liệu (email/chat/article/notice/table/box) trong khung; câu hỏi nằm dưới. Marker `[1]`–`[4]` trong đoạn được làm nổi bật.
- Nộp bài: confirm dialog hiển thị số câu đã trả lời / còn trống / số cờ; câu trống tính sai.
- Sau khi nộp: lưu attempt vào Reading history, xoá draft, chuyển `/reading/results?id=...`.

## 5. Dữ liệu

### 5.1 Câu hỏi

Mỗi câu gồm: `id` (1–100), `part` (5|6|7), `passageId` (null với Part 5), `prompt`, 4 `options` (A–D), `answer`.

- Part 5: `prompt` là câu văn gốc, giữ nguyên `------`.
- Part 6/7: `prompt` là câu hỏi in trong đề.
- Option text giữ nguyên văn, kể cả lỗi chính tả/khác biệt Anh–Mỹ trong nguồn.

### 5.2 Đoạn đọc

`ReadingPassage`: `id`, `part` (6|7), `intro` (dòng “Questions 31–34 refer to…”), `documents[]`, `questionIds[]`.

`ReadingDocument`: 1 tài liệu, gồm `kind`/`title` và `blocks[]`. Block hỗ trợ tối thiểu:

- `title`, `subtitle`
- `meta` (dòng địa chỉ/ngày/người gửi — giữ thứ tự)
- `paragraph` (có thể chứa `{{31}}` cho chỗ trống Part 6 và `[1]`–`[4]` cho marker Part 7)
- `list` (ordered/unordered)
- `email` (to/from/date/subject + body paragraphs)
- `chat` (author, time, text)
- `table` (head + rows) — dùng cho order receipt câu 86–90
- `box` (text message / reservation details)
- `quote` (testimonial)
- `divider`

Không cần hỗ trợ ảnh — 2 PDF Reading **không có ảnh** (đã kiểm tra `page.get_images()` = 0).

### 5.3 Đáp án

Nguồn chuẩn: `docs/extracted/reading_answer_key.json`. Đã đối chiếu 100/100 chữ đỏ trong PDF đáp án.

Chuỗi đáp án (để đối chiếu nhanh):

```
1-10   A D B A D C B A A C
11-20  B C A D C D B C A B
21-30  C A D A C C A C D D
31-40  D C C B A D B B B A
41-50  C D D C A C D D B C
51-60  D C D C B A B D C A
61-70  A B C C D B C A C D
71-80  C C B C A D D D A B
81-90  D B B C D B D B A C
91-100 D A C B C A B B D C
```

### 5.4 Bất thường nguồn (giữ nguyên, không tự sửa)

1. **Câu 78**: hỏi “what can audience members do at Cole Hall?” nhưng đoạn text message không nhắc coat check; đáp án PDF là **D. Check coats**. Giữ nguyên câu hỏi/đáp án, ghi comment trong data. Không bịa thêm thông tin vào đoạn.
2. **Câu 86–90**: đề ghi “chart and emails” nhưng “chart” là bảng order receipt dạng text (Item/Cost). Render thành bảng.
3. **Câu 81–85**: báo cáo có 4 khuyến nghị; khuyến nghị thứ 4 bị mất số trong PDF. Render là “4.” để khớp câu 85 (đáp án D).
4. Giữ nguyên các lỗi gõ trong nguồn (ví dụ “(B)donations”, “specialise”, “colourful”, dấu câu…). Không “sửa lỗi” nội dung tiếng Anh.

## 6. Scoring

- Raw = số câu đúng / 100.
- Quy đổi ước lượng: `max(5, round(raw / 100 * 495 / 5) * 5)` — cùng công thức Listening, ghi rõ **ước lượng**, không phải ETS.
- Breakdown theo Part 5/6/7.
- “Part cần ôn nhất” = Part có tỷ lệ đúng thấp nhất (tie → Part nhỏ hơn).
- Lời khuyên riêng cho Reading:
  - Part 5: word forms, thì, giới từ, liên từ, collocation.
  - Part 6: đọc cả đoạn, cohesive devices, chèn câu, thể bị động.
  - Part 7: skim mục đích/ý chính, scan chi tiết, đối chiếu nhiều tài liệu, từ vựng trong ngữ cảnh, suy luận.

## 7. Storage (localStorage, tách khỏi Listening)

| Key | Nội dung |
|---|---|
| `cdr.reading.draft.v1` | `{ answers, flags, savedAt }` |
| `cdr.reading.history.v1` | tối đa 50 attempt Reading |
| `cdr.reading.mastered.v1` | `{ [questionId]: true }` |

- Không đọc/ghi đè các key Listening hiện có (`cdr.draft.v1`, `cdr.history.v1`, `cdr.mastered.v1`).
- Xoá lịch sử Reading chỉ xoá 3 key Reading; không đụng Listening.

## 8. Kết quả (Reading results)

- Header `READING REVISION · 28/11/2026`, tiêu đề “Kết quả bài làm”.
- ScoreRing raw + điểm quy đổi 5–495 + delta so với lần trước + disclaimer.
- Breakdown Part 5/6/7 + gợi ý Part yếu.
- Chi tiết câu: lọc “Chỉ câu sai / Tất cả”.
  - Nhóm theo passage. Mỗi nhóm hiển thị tiêu đề bộ đoạn; đoạn văn trong **accordion mặc định thu gọn** (“Xem đoạn văn”) để trang không quá dài, nhưng câu hỏi luôn hiển thị.
  - Part 5 hiển thị từng câu độc lập (không passage).
  - Mỗi câu: đáp án đúng (xanh), bạn chọn (đỏ nếu sai), đáp án chữ.
- CTA: Làm lại Reading / Ôn tập Reading / Trang chủ.

## 9. Ôn tập (Reading review)

- Hiển thị toàn bộ 100 câu, nhóm theo Part 5 → 6 → 7, trong Part 7 nhóm theo passage.
- Mỗi passage có accordion; mặc định **mở** để học (khác results).
- Toggle “Đã nắm” từng câu; lọc “Tất cả / Chưa nắm”; tìm kiếm theo số câu, câu hỏi, options, nội dung đoạn.
- Bảng “câu sai nhiều nhất” (top 10) từ Reading history.
- Nút xoá lịch sử Reading (confirm rõ ràng).
- Không có TTS (Reading không cần nghe).

## 10. UI / Design

- Dùng lại design system hiện có: giấy ngà, teal, gold, serif display, motion tokens, reduced-motion.
- Khung đoạn đọc: `bg-white`, border `line`, padding thoáng, `text-[15px] leading-7`; email/chat/table có style riêng để dễ đọc.
- Chip chỗ trống Part 6 và marker `[n]`: nền `brand-soft`, chữ `brand-dark`, bo nhỏ; khi đã chọn, chip hiển thị chữ cái đã chọn.
- Bảng receipt: cuộn ngang được trên mobile, không tràn layout.
- Navigator Reading: 3 Part, lưới 10 cột, ô vuông đều; Part 5 có 30 ô (3 hàng), Part 6 16 ô, Part 7 54 ô.
- Mobile: tài liệu hiển thị trên câu hỏi, không sticky; bottom sheet navigator giữ nguyên pattern.
- Không emoji; icon SVG inline; không thêm dependency.

## 11. Acceptance criteria

1. `npm run build` PASS, 0 lỗi TypeScript/ESLint.
2. `/reading/practice` hiển thị đủ 100 câu; Part 6 có đúng 4 đoạn; Part 7 có đúng 15 bộ đoạn.
3. Mọi câu có đúng 4 option A–D; đáp án khớp `reading_answer_key.json` 100/100 (verify bằng script).
4. Nội dung tiếng Anh khớp PDF: không thiếu đoạn, không bịa câu; kiểm tra bằng đối chiếu text (chuẩn hoá khoảng trắng) với `reading_test_raw.md`.
5. Đồng hồ 75:00; hết giờ tự nộp; draft autosave/restore hoạt động.
6. Navigator nhảy đúng câu, tiến độ đúng, cờ đúng; bottom sheet mobile không tràn ngang.
7. Nộp bài → results đúng raw/scaled/breakdown; reload results vẫn còn (localStorage).
8. Review hiển thị đủ đáp án + đoạn văn; toggle “đã nắm” lưu qua reload.
9. Không ảnh hưởng Listening: các route `/practice`, `/results`, `/review` vẫn hoạt động, key localStorage cũ không bị đọc/ghi sai.
10. 0 console error trên các trang mới; reduced-motion không làm hỏng layout.
11. Không dependency mới; không đổi PDF/docs gốc.

## 12. Ngoài phạm vi

- Không có audio cho Reading (đề Reading không có audio).
- Không có backend, tài khoản, đồng bộ đám mây.
- Không làm chế độ thi thử 200 câu Listening + Reading liên tục.
- Không chấm điểm ETS chính thức; không đối chiếu bảng quy đổi ETS thật.
- Không thêm tính năng dịch từng câu/giải thích ngữ pháp tự động.

## 13. Câu hỏi mở cho Founder

1. Có muốn giữ thương hiệu “LISTENING REVISION” trên trang chủ hay đổi thành “TOEIC REVISION” (bao trùm cả 2 module)? Đề xuất: **TOEIC REVISION**.
2. Câu 78 trong PDF gốc không có dữ kiện “check coats” nhưng đáp án là D — giữ nguyên và ghi chú, hay loại câu này? Đề xuất: **giữ nguyên** (không tự sửa nguồn).
