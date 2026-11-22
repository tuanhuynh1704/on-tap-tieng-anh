# Audit nội dung — `src/data/reading.ts` vs PDF Reading

Ngày: 20/11/2026  
Phạm vi: đối chiếu **nội dung tiếng Anh** (không phải đáp án) giữa dữ liệu đang dùng trong app và nguồn:
- PDF: `docs/READING REVISION_28.11.2026.pdf` (render trang bằng PyMuPDF khi cần).
- Text trích xuất: `docs/extracted/reading_test_raw.md`.
- Đáp án: `docs/extracted/reading_answer_key.json` (đã verify 100/100, không phải đối tượng audit này).

Phương pháp: chuẩn hoá khoảng trắng/ký hiệu (`______(31)` ↔ `{{31}}`, `--37--` ↔ `{{37}}`, bỏ zero-width, page header, curly quote) rồi so khớp từng literal trong `reading.ts` và từng câu trong text gốc. Script: `docs/extracted/audit_reading_text3.py`, `docs/extracted/missing_sentences.py`. Kết quả: 426 literal ≥20 ký tự, sau chuẩn hoá còn 26 literal “missing”; phần lớn là khác biệt định dạng (gộp đoạn, line-break hyphenation), phần còn lại là lệch nội dung thật liệt kê dưới đây.

## Lỗi đã xác nhận (đã giao `tidepool` sửa)

| # | Vị trí | Text trong data | Text đúng theo PDF | Mức |
|---|---|---|---|---|
| 1 | `ReadingDocumentCard.tsx`, case `email` | `renderText(line)` | `renderText(line, onBlank, chosen)` — nếu không, câu 39–46 hiện `{{39}}` thay vì chip | critical (UI) |
| 2 | Passage 61–63 (trang 10) | Thiếu hoàn toàn mở bài | `OTTAWA (22 May)` + `Waldenstone Business Review has added a new category…` + `The Waldenstone Corporate Prize is awarded to a business with the foresight…` | critical — câu 61 hỏi “purpose of the article” |
| 3 | Passage 58–60 (trang 9) | Chỉ To/From/Date/Subject | Thiếu `Kipbank Business Services / 548 Sycamore Lake Road / Green Bay, WI 54301`, địa chỉ người nhận `Madeline Omar / Passionflower Interior Design / 1556 Deer Run Road / Green Bay, WI 54301`, và `Dear Ms. Omar,` | minor |
| 4 | Passage 96–100 (trang 20) | Notice gộp URL + câu “We hope…”; web page có paragraph bịa `Book club — Westwood Library…` | 2 khung riêng: notice kết thúc tại `…circulation desk`; web page bắt đầu bằng `https://www.westwoodlibrary.org/bookclub`, rồi `We hope you will join us…!`, `Below are the titles selected for the first half of the year.`, rồi danh sách January–June | critical (bịa nội dung) |
| 5 | Passage 72–75 (trang 12–13) | Title `Sarah's Catering`; không có heading trích dẫn | `Sarah's Catering - What You Serve Matters`; heading `What people are saying` trước 2 quote | minor |
| 6 | Passage 81–85 (trang 15) | `From: Iqbal Grewal, Director of Business Transformation — Woolf Flooring` | `From: iqbal_grewal@woolfflooring.com.au` | minor |
| 7 | Passage 91–95 (trang 19) | `Dear all,`; From có chức danh; signature thiếu dòng chức danh | `Hello all,`; `From: Fran Corliss`; signature `Fran Corliss` + `Director of Mobile Banking, Ogden Bank` | minor |
| 8 | Intro 64, 76, 86, 91, 96 | Tự đổi thành `advertisement`, `schedule and text message`, `email, order receipt table, and reply email`, `e-mails and article`, `notice, web page, and e-mail` | `job posting`, `article and e-mail`, `chart and emails`, `e-mails.`, `e-mail, article, and Web page` | minor (vi phạm nguyên tắc giữ nguyên văn) |
| 9 | Passage 56–57 | Gộp title + body thành một paragraph, thêm dấu chấm sau `Bryanton` | Title riêng `Notice for residents and contractors working in Bryanton`, body bắt đầu `Beginning on Monday, July 1, …` | minor |

## Đã sửa trước audit (xác nhận đúng)

- `Betty Radio Show` → `Bethesda Radio Show` (passage 76–80).
- `colorful` → `colourful` (passage 39–42, đúng theo nguồn Anh–Anh).

## Nghi vấn đã kiểm tra nhưng KHÔNG phải lỗi

- **Q100 option C** `It inspired her to explore an old interest. .` — chính PDF có dấu chấm thừa; data giữ nguyên là đúng.
- **Q44 options** `cautiously / patiently / largely / quietly` — khớp PDF.
- **Recommendation 4 (Q85)** PDF mất số “4.”; data thêm “4.” theo quyết định ghi trong PRD (cố ý, không phải transcription error).
- **Q86–90 reply email** tưởng bị cắt câu `Also, there will be more guests…` — thực ra data có paragraph riêng, đúng.
- **`£39.50` / `£32.00`** bị gãy dòng trong text trích xuất (`£39.5\n0`) — data gộp đúng.
- Nhiều literal “missing” khác chỉ là gộp đoạn, line-break hyphenation (`cost-\nefficient` → `cost-efficient`), hoặc ký hiệu bullet/zero-width.

## Trạng thái kiểm chứng

- `node docs/extracted/verify_reading.cjs` → PASS: 100 câu, part 30/16/54, 4 options A–D, đáp án 100/100, 19 passage, Part 6 blank 16/16, raw text 484/484 khớp, 0 problem.
- `npm run build` → PASS, 9 routes (gồm 4 route Reading).
- Việc sửa 9 lỗi trong bảng trên do `tidepool` thực hiện; kết quả cuối cùng được xác nhận bằng build + verify + browser QA riêng.
