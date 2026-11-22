# UI Upgrade — “Phòng thi tiếng Anh chuyên nghiệp”

Mục tiêu: nâng toàn bộ giao diện lên cảm giác **giáo dục/kỳ thi tiếng Anh chuyên nghiệp** (tham chiếu: Cambridge exam center) — giấy ngà ấm, xanh ngọc đậm, vàng gold — và có **hiệu ứng xuất hiện** tinh tế, tôn trọng `prefers-reduced-motion`. Không đổi hành vi/logic/data; không thêm dependency (motion bằng CSS + React inline).

## Design tokens (globals.css `@theme`)
- `--color-paper: #faf7ef` (giấy ngà) · `--color-paper-deep: #f1ede1` (vùng phụ) · `--color-surface: #ffffff`
- `--color-ink: #16302c` (mực xanh đậm) · `--color-ink-soft: #52716b`
- `--color-brand: #0f766e` · `--color-brand-dark: #115e59` · `--color-brand-soft: #e3efe9`
- `--color-accent: #c9a227` (gold học thuật) — CTA chính giữ amber #d97706/nhưng harmonize; danger `#b91c1c`, ok `#15803d`
- `--color-line: #e2ddd0` (viền ngà)
- Shadows: `--shadow-card: 0 1px 2px rgb(16 48 44/.06), 0 8px 24px -12px rgb(16 48 44/.18)` · `--shadow-lift` (hover) · `--shadow-sheet`
- Radius: card `1.25rem`, cell `0.5rem`, pill `9999px`
- Display font stack: `Georgia, 'Times New Roman', 'Noto Serif', serif` cho tiêu đề lớn/điểm số (cảm giác học thuật); body giữ system sans hiện có. Thêm utility `.font-display`.

## Motion (CSS, zero-dep)
`@theme`: `--animate-fade-up`, `--animate-fade-in`, `--animate-scale-in`, `--animate-shimmer`, `--animate-draw-ring` (SVG stroke). Keyframes: fade-up (opacity+translateY(14px), .56s, ease-out), fade-in, scale-in (.92→1), shimmer (cho skeleton), draw-ring.
- Stagger bằng `style={{ animationDelay: ... }}` (mỗi phần tử cách 60–120ms).
- Bar chấm/progress: transition width .8s; ScoreRing: `stroke-dashoffset` transition 1.2s; số điểm count-up nhẹ.
- Tactile: buttons `active:scale-[.98]`, hover lift `-translate-y-0.5` + shadow; option select: “pop” scale .97→1.03→1.
- `prefers-reduced-motion: reduce` → tắt mọi animation/transition (đã có, giữ + mở rộng).

## Per-page
1. **Shared `SiteHeader`** (mới, slim): monogram “LR” trong ô teal + wordmark “LISTENING REVISION · 28/11/2026”, nav “Trang chủ / Làm bài / Ôn tập”, active state. Dùng ở cả 4 trang (trên `/practice` thay header hiện tại nhưng GIỮ timer + controls).
2. **Home**: hero 2 cột — trái: eyebrow “TOEIC · LISTENING PRACTICE”, display serif “LISTENING REVISION.”, sub, CTA kép (amber “Bắt đầu làm bài” + viền “Ôn tập & đáp án”), hàng trust chips (100 câu · ~45 phút · 4 Part · Miễn phí tài khoản); phải: card “exam cover” kiểu bìa đề thi (quốc huy giả “OFFICIAL PRACTICE EXAM”, serif, số đề “28.11.2026”) + dấu trang trí. Background: radial gold/teal gradients mờ + chấm mờ (dot grid). Stats card: skeleton shimmer thay “Đang tải…”, icon SVG trong ô bo, số tabular. Section “Cách tính điểm & lưu trữ” + example PART I giữ nguyên nội dung, nâng layout.
3. **Practice**: khung trang giấy đề thi (container `bg-surface` viền ngà shadow-card); sticky part header gradient ngà; câu hỏi card viền ngà, số câu trong ô teal; option letter chip (A/B/C/D) bo full, selected state fill + pop animation; nút flag hover; sidebar panel đã có — thêm refine (card shadow-lift).
4. **Results**: header “Kết quả bài làm” serif; ScoreRing lớn hơn + draw animation + count-up; badge delta; breakdown bars staggered; confetti? KHÔNG; câu sai card với badge “Sai” đỏ nhạt; CTA rõ.
5. **Review**: accordion với chevron rotate 180°, expand mượt (CSS grid-rows trick), card hover lift; nút “Nghe” gold-outline; filter pills segmented control.
6. **Footer** chung: 1 dòng monogram + “Tài liệu ôn tập nội bộ” + disclaimer ước lượng.

## Ràng buộc
Không đổi data/logic/storage/TTS/route; không dependency; không emoji; ảnh `public/exam/*` giữ nguyên (alt đã đúng); tất cả animation qua `.animate-*`/inline delay; focus-visible giữ.

## Verify
`npm run build` PASS; headless CDP screenshot desktop 1440 + sheet 375; 0 console error; reduced-motion media query có effect (test bằng CDP emulation nếu được); báo path ảnh.
