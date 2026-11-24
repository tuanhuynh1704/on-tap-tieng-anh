# Review độc lập — Fix “fresh start CTA”

Ngày: 24/11/2026
Người review: `nemotron-supervl` (read-only; không sửa product code, không commit)
Phạm vi: 2 file uncommitted `src/app/page.tsx`, `src/app/reading/page.tsx`; đối chiếu `src/lib/storage.ts`, `src/lib/reading-storage.ts`, `src/components/SiteHeader.tsx`, harness `docs/extracted/verify_fresh_start.mjs`, `docs/extracted/supp_fresh_check.mjs`.

> Ghi chú: reviewer báo đã tạo file này nhưng file không tồn tại trên đĩa; nội dung dưới đây được coordinator ghi lại trung thực từ báo cáo review gửi về, không bổ sung kết luận mới.

## Quyết định: APPROVED

Không có blocker/major. Một minor về harness (không ảnh hưởng kết luận).

## Kết quả theo từng câu hỏi

### 1. Import/module — không sai
- `src/app/page.tsx:14` import `clearDraft` từ `@/lib/storage`; `storage.ts:58–60` xoá `DRAFT_KEY = "cdr.draft.v1"` (`storage.ts:4`). Hai nút Listening (`page.tsx:111` hero, `page.tsx:200` card) dùng đúng module Listening.
- `src/app/reading/page.tsx:8` import `clearDraft` từ `@/lib/reading-storage`; `reading-storage.ts:60–62` xoá `R_DRAFT_KEY = "cdr.reading.draft.v1"` (`reading-storage.ts:6`). Nút Reading (`reading/page.tsx:67`) dùng đúng module Reading.
- Hai export trùng tên nhưng khác module, import rõ ràng, kiểu `(): void` đồng nhất, không xung đột typing; `clearDraft` được dùng trong `onClick` nên không unused.

### 2. Entry point còn khôi phục draft cũ — không, trong scope fix
- Hero Listening `page.tsx:111`, card Listening `page.tsx:200`, hero Reading `reading/page.tsx:67` đều gọi `clearDraft()`.
- Hai nút “Làm Reading” ở trang chủ (`page.tsx:117`, `:226`) dẫn hub `/reading` (không phải `/reading/practice`) — đúng spec, giữ nguyên.
- `SiteHeader.tsx:9` (`href="/practice"`) vẫn được phép resume — spec chỉ định cố ý giữ hành vi điều hướng khu vực.
- “Làm lại” ở results đã clear sẵn.

### 3. Rủi ro xoá nhầm history/mastered, SSR/hydration — không
- `clearDraft` chỉ `removeItem` đúng draft key; không chạm `HISTORY_KEY` / `MASTERED_KEY`. `clearHistoryAndMastered` nằm riêng trong ConfirmDialog và chỉ chạy khi người dùng xác nhận.
- Chỉ chạy trong `onClick` client-side, có guard `canUseStorage()` (`typeof window`), không chạy trong render/SSR → không ảnh hưởng hydration.

### 4. Test harness — đủ tin cậy, một minor
- Build 9 route PASS; `verify_fresh_start.mjs` 13/13 PASS; `supp_fresh_check.mjs` 16/16 PASS; console 0 error / 0 exception; localStorage đã restore.
- Minor: `verify_fresh_start.mjs:193` viết `t4.beforeDraft = await draftParsed2;` (await function reference). Biến `t4.beforeDraft` không được dùng trong assert nào; assert dùng `t4.draftAfter = await draftParsed2()` ở dòng 200 (gọi đúng). Không ảnh hưởng kết luận. Đã sửa hậu review thành `await draftParsed2()`.

## Bằng chứng kèm theo
- `docs/extracted/verify_fresh_start.json` — 13 assert.
- `docs/extracted/supp_fresh_check.json` — 16 assert (bổ sung kiểm tra cờ đánh dấu, điểm vào thứ 2, F5, Reading).
- `npm run build` — PASS, 9 route.
- Console các trang `/`, `/practice`, `/reading`: 0 error / 0 exception.

---

## Cập nhật lần 2 — fix Activity + StrictMode (24/11/2026)

Review độc lập cho phần sửa **thứ hai** (thêm đối chiếu draft trong `src/app/practice/page.tsx`, `src/app/reading/practice/page.tsx` và `freshResetRef`) **KHÔNG thực hiện được**:

- `longcat`: `Model unavailable: opencode/longcat-2.5-free`.
- `nemotron-supervl`: `Free usage limit reached` (hết quota khi đang chạy).

Vì vậy phần dưới đây là **tự kiểm chứng của coordinator**, không phải review độc lập:

- Đã đọc trực tiếp `git diff` của 4 file; import/layout effect/ref/handler đúng module, không đổi storage key hay history/mastered, không thêm dependency.
- `npm run build` PASS, 9 route.
- `node docs/extracted/verify_fresh_activity.mjs`: 17/17 assert PASS (prod, SPA click, selector lọc phần tử visible, localStorage restore, port 3215 đóng).
- `node docs/extracted/repro_submit_flow.mjs` chạy 2 lần trên dev `:3000`: sau CTA `selected 0, flagged 0, timer 45:00, draft null`, console 0.
- `node docs/extracted/verify_dev_strict_resume.mjs`: allPass true — resume/nav header, cờ, F5, CTA hero + card, Reading F5 + browser-back; console 0 error/0 exception.
- Rủi ro đã xem xét: `freshResetRef` chỉ chặn auto-save trong lượt mới, được bật lại trong `selectAnswer`/`toggleFlag`, nên không chặn vĩnh viễn draft người dùng; resume/F5 vẫn lưu draft bình thường. Trước fix, chính repro dev cho `selected 1 / draft {1:A}`; sau fix cho 0/null.

Kết luận tự kiểm chứng: OK để bàn giao, nhưng **chưa có review độc lập cho lần sửa này** — cần Founder/Lead review nếu bắt buộc quy trình.
