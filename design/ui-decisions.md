# UI/UX — on-tap-ta-cdr (TOEIC Listening ôn tập)

Nguyên tắc: tập trung đọc/nghe tiếng Anh, ít xao nhãng; UI tiếng Việt; một cột nội dung chính + sidebar điều hướng trên desktop; mobile dùng collapsible drawer/bottom bar.

## Hệ thống giao diện
- Màu: nền tối ấm cho trang đề (`#0f1517`–`#16211f` style) **hoặc** nền giấy sáng? Quyết định: **light “paper” theme** với accent xanh teal đậm (`#0f766e`) + vàng amber (`#d97706`) cho CTA & điểm nhấn; màu báo đúng/sai: xanh lá / đỏ; đảm bảo contrast AA.
- Typography: system stack hỗ trợ tiếng Việt (Segoe UI, Noto Sans…), không dùng Google Fonts runtime (tránh phụ thuộc mạng); headings đậm, số câu tabular.
- Trạng thái câu hỏi trong grid điều hướng: chưa làm (viền mờ), đã chọn (teal), đánh dấu cờ (amber), đúng (xanh), sai (đỏ) — sau nộp bài.

## Trang chủ (`/`)
- Hero nhỏ: tên đề “Listening Revision 28/11/2026”, mô tả 4 Part, 100 câu, 45 phút; badges (Part I: 6 câu ảnh · Part II: 25 câu · Part III: 39 câu · Part IV: 30 câu).
- Card thống kê: số lần làm, best scaled, trung bình, câu sai nhiều nhất (top 3).
- 2 CTA lớn: “Bắt đầu làm bài” / “Ôn tập & xem đáp án”. Ví dụ minh hoạ PART I (ảnh + câu (D) “They’re taking photographs”).

## Làm bài (`/practice`)
- Header dính: bộ đếm giờ 45:00 (có thể ẩn/hiện), nút “Nộp bài”, nút "Lưu nháp" tự động.
- Trái: câu hỏi theo Part; PART I hiển thị ảnh lớn; 64–70/95–100 có graphic kèm theo.
- Transcript ẩn mặc định trong lúc làm (toggle “Hiện gợi ý nghe” cho chế độ ôn, không cho nộp bài thi thật? — Quyết định: trong `/practice` có nút “Nghe transcript” như nghe đề thật; không hiện text).
- Phải (desktop): grid 100 ô số + cờ đánh dấu; mobile: bottom bar mở sheet.
- Nộp bài: modal xác nhận hiển thị số câu chưa làm / chưa flag; route sang `/results`.

## Kết quả (`/results`)
- Vòng tròn điểm: raw /100, scaled ước lượng (ghi chú “ước lượng”), delta so với lần trước, breakdown 4 Part (bar) + gợi ý ôn theo Part yếu nhất.
- Danh sách câu sai: số câu, đáp án bạn chọn, đáp án đúng, transcript + nút Nghe, highlight từ khoá; filter “Chỉ câu sai / Tất cả”.
- CTA: “Làm lại”, “Ôn tập toàn bộ”, “Về trang chủ”.

## Ôn tập (`/review`)
- Accordion theo Part → theo group hội thoại/bài nói; mỗi câu: badge đáp án đúng, transcript full với câu được cue `(32)` được highlight; nút Nghe; toggle “Đã nắm” per question (localStorage); filter “Chưa nắm / Tất cả”; ô tìm kiếm text.
- Bảng “Câu hay sai” từ lịch sử attempts.

## Kỹ thuật UI
- Tailwind 4 + CSS variables; dark-on-light; `prefers-reduced-motion`; focus-visible rõ; touch target ≥ 44px; ảnh `next/image` với alt mô tả.
- Không emoji; icon dùng SVG inline (chevron, flag, volume, check/x).
