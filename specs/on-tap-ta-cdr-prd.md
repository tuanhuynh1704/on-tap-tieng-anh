# PRD — Website Ôn Tập TOEIC Listening “on-tap-ta-cdr”

Nguồn: 3 PDF trong `docs/` (đề thi không đáp án, answer key chữ đỏ, script có transcript).
Mục tiêu: **một bài ôn duy nhất, 100 câu, ôn đi ôn lại nhiều lần** trên web — không cần đăng nhập, không backend.

## Phạm vi (in-scope)
- Bài ôn hợp nhất 100 câu TOEIC Listening (Part I–IV), đúng thứ tự đề gốc.
- **Chế độ Làm bài** (`/practice`): làm toàn bộ 100 câu trong một phiên; bộ đếm giờ 45:00 (bật/tắt); bảng điều hướng câu 1–100 (đã trả lời / chưa / đánh dấu); chấm khi nộp bài.
- **Chấm điểm**: đúng/sai từng câu, điểm raw theo từng Part, quy đổi **ước lượng** theo công thức `raw * 4.95` (0–495, không làm tròn), **ghi rõ là ước lượng**; phân tích theo Part; liệt kê câu sai kèm đáp án đúng + transcript.
- **Chế độ Ôn tập** (`/review`): xem toàn bộ 100 câu cùng đáp án + script/hội thoại/transcript; lọc theo Part; đánh dấu “đã nắm / chưa nắm” (localStorage); liệt kê câu sai nhiều nhất từ lịch sử.
- **TTS**: đọc transcript tiếng Anh bằng Web Speech API (`speechSynthesis`), nút “Nghe” mỗi Part I (đọc 4 mệnh đề), Part II (đọc câu hỏi + 3 đáp án) và mỗi group Part III/IV (đọc theo lượt thoại). Tốc độ: 0.8x / 1.0x. Ẩn nút + ghi chú nếu trình duyệt không hỗ trợ.
- **Lịch sử & thống kê** (localStorage): số lần làm, điểm tốt nhất, điểm trung bình, top câu sai nhiều nhất, nút “Xoá lịch sử”. Draft đang làm dở được lưu để không mất khi reload.
- Trang chủ (`/`): giới thiệu đề, thống kê cá nhân, nút “Bắt đầu làm bài” / “Vào ôn tập”, liên kết đến thư viện giải thích.
- Thư viện giải thích (`/explanations`): tra cứu lời giải cho toàn bộ 200 câu Listening và Reading.
- Ảnh PART I và 5 graphic (Q63, Q66, Q69, Q97, Q99) lấy từ `public/exam/`.
- UI tiếng Việt; nội dung đề tiếng Anh giữ nguyên gốc.

## Out of scope
- Không audio thật (không tách được track từ PDF) — chỉ TTS từ transcript.
- Không Reading test, không Part 5–7, không tạo câu hỏi mới.
- Không tài khoản/đăng nhập/đồng bộ cloud; dữ liệu chỉ ở localStorage của trình duyệt.
- Không quy đổi điểm “chính thức” — chỉ ước lượng; không claim chuẩn ETS.
- Không chỉnh sửa/xoá 3 PDF gốc.

## Yêu cầu nội dung
- `docs/extracted/*.md` là nguồn trích xuất (đã giữ trong repo). Inkler được phép đọc để lấy transcript; answer key đã chốt (xem mục “Đáp án chốt”).
- Ảnh: `public/exam/q01.png…q06.png` (PART I), `graphic-q63.png`, `graphic-q66.png`, `graphic-q69.png`, `graphic-q97.png`, `graphic-q99.png`, `example.png` (ví dụ minh hoạ, không tính điểm).

## Đáp án chốt (đã verify từ chữ đỏ trong answer key)
- Part I (1–6): 1A 2C 3B 4D 5A 6D
- Part II (7–31): 7B 8B 9C 10A 11C 12A 13A 14B 15A 16A 17A 18B 19B 20B 21B 22A 23B 24A 25A 26B 27B 28A 29A 30A 31A
- Part III (32–70): 32B 33C 34A 35B 36C 37A 38A 39D 40C 41B 42A 43B 44C 45B 46A 47C 48C 49A 50D 51C 52A 53A 54D 55C 56D 57C 58C 59C 60A 61C 62B 63D 64B 65C 66D 67D 68A 69B 70A
- Part IV (71–100): 71A 72B 73A 74C 75A 76C 77C 78B 79D 80A 81C 82C 83B 84A 85B 86D 87B 88A 89C 90A 91C 92A 93D 94C 95A 96C 97B 98C 99D 100D

## Cấu trúc kỹ thuật (đề xuất)
- `src/data/exam.ts` — types + dữ liệu 100 câu (group theo Part và theo conversation/talk).
- `src/lib/scoring.ts` — raw/scaled/per-part.
- `src/lib/storage.ts` — draft, lịch sử, thống kê, xoá lịch sử.
- `src/lib/tts.ts` — wrapper Web Speech API.
- `src/app/page.tsx`, `src/app/practice/page.tsx`, `src/app/results/page.tsx`, `src/app/review/page.tsx` + `src/components/*`.
- Dữ liệu tĩnh, không cần DB. Motion tiết chế, tôn trọng `prefers-reduced-motion`.

## Tiêu chí hoàn thành
1. `npm run build` PASS, không lỗi TS/eslint nghiêm trọng.
2. Làm bài đủ 100 câu → nộp → thấy điểm, quy đổi, phân tích Part, danh sách câu sai; làm lại được nhiều lần; lịch sử lưu đúng sau reload.
3. Review hiển thị đủ 100 câu + transcript + nút nghe TTS (nếu trình duyệt hỗ trợ).
4. Ảnh hiển thị đúng câu.
5. UI verified bằng screenshot (hy4-flash); diff được tidepool review.

## Founder cần biết / quyết định mở
- Điểm quy đổi là **ước lượng**, không phải điểm ETS chính thức.
- Chất lượng giọng đọc phụ thuộc trình duyệt (Chrome/Edge tốt hơn Firefox); không có file audio gốc nên không thể mô phỏng đúng giọng máy thật.
- Transcript ký hiệu người nói: M-Au/M-Am/M-Cn (nam), W-Am/W-Br (nữ) — khi đọc có thể đọc tên vai hoặc bỏ qua, xem chi tiết ở spec data.
