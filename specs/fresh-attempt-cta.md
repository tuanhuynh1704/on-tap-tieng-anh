# Spec — Nút “Làm Listening” phải bắt đầu bài mới

Ngày: 24/11/2026 (cập nhật lần 2)
Trạng thái: đã sửa xong (Activity + StrictMode); đã build + kiểm chứng prod và dev, chờ Founder xác nhận
Liên quan: `src/app/page.tsx`, `src/app/reading/page.tsx`, `src/app/practice/page.tsx`, `src/app/reading/practice/page.tsx`, `src/lib/storage.ts`, `src/lib/reading-storage.ts`

## 1. Vấn đề

`/practice` và `/reading/practice` tự động nạp draft từ localStorage khi mount (đúng cho việc F5 giữa bài). Nhưng các nút “bắt đầu làm bài” ở trang chủ / hub Reading cũng trỏ thẳng vào 2 trang này, nên khi người dùng đã làm dở một lượt trước đó, bấm “Làm Listening →” sẽ **hiện lại đáp án cũ và tiếp tục bài cũ** thay vì bắt đầu lượt mới.

Founder yêu cầu: nút “Làm Listening →” dùng để **bắt đầu làm bài mới hoàn toàn**; đáp án cũ và lịch sử cũ không được hiển thị lại; phải làm lại được chứ không phải làm tiếp.

## 2. Nguyên nhân gốc (phát hiện 24/11/2026)

`next.config.ts` bật `cacheComponents: true`; Next.js 16 dùng React `<Activity>` để **giữ nguyên state và DOM** của trang khi điều hướng (trang bị ẩn bằng `display: none`, không bị unmount). Hệ quả:

1. `clearDraft()` chỉ xoá localStorage. State React của trang practice (đáp án, cờ, timer, currentId...) vẫn còn sống trong cây Activity đang bị ẩn.
2. Khi bấm CTA quay lại `/practice`, React chỉ hiện lại đúng cây cũ; effect auto-save chạy lại và **ghi đáp án cũ trở lại localStorage**.
3. Vì vậy test seed draft rồi bấm CTA vẫn pass (draft bị xoá trước khi trang được hiện), nhưng luồng thật “làm bài → nộp → về trang chủ → bấm Làm Listening” vẫn tái hiện lỗi.

Đã tái hiện được trên dev server: sau khi nộp, `cdr.draft.v1 = null`; bấm “Làm Listening” thì `/practice` hiện 1 đáp án đã chọn, timer tiếp tục 44:58 và draft bị ghi lại. (`docs/extracted/repro_submit_flow.json`)

### 2.1. Lỗi riêng của dev — React Strict Mode (phát hiện 24/11/2026)

App Router bật React Strict Mode mặc định trong môi trường dev (Next.js docs `reactStrictMode.md`: từ 13.5.1, Strict Mode = true với `app` router). Strict Mode chạy effect thêm một lần. Với cách sửa “đối chiếu draft khi trang hiển thị”, trình tự ở dev là:

1. Lần chạy 1: không có draft → reset state (timer 45:00) + `clearDraft()`.
2. Auto-save effect chạy với closure `answers` cũ → ghi lại draft `{answers:{"1":"A"}}`.
3. Lần chạy 2 của effect đọc draft vừa ghi → khôi phục đáp án cũ. Timer vẫn 45:00.

Production không có Strict Mode nên chỉ chạy 1 lần và không tái hiện. Vì vậy fix phải **idempotent qua nhiều lần effect chạy**: dùng cờ `freshResetRef` để chặn auto-save trong chu kỳ fresh-reset; chỉ bật lại auto-save khi người dùng thực sự chọn đáp án / đánh dấu câu.

## 3. Quy tắc

1. Mọi điểm vào được thiết kế là “bắt đầu làm bài” phải xoá draft của module tương ứng **trước khi** chuyển sang trang practice.
2. Trang practice phải **đối chiếu với draft mỗi lần trở nên hiển thị** (kể cả khi được Activity hiện lại, không chỉ lần mount đầu):
   - Draft có nội dung → khôi phục đáp án/cờ (resume bình thường).
   - Draft không có nội dung hoặc không tồn tại → **reset toàn bộ state của lượt làm bài** (đáp án, cờ, timer, câu hiện tại, trạng thái tạm) và xoá draft rỗng còn sót.
3. Draft vẫn được giữ và khôi phục khi người dùng F5 / mở lại trang practice giữa bài (không thay đổi hành vi này).
4. Lịch sử làm bài (`cdr.history.v1`, `cdr.reading.history.v1`) và trạng thái “đã nắm” (`cdr.mastered.v1`, `cdr.reading.mastered.v1`) **không bị xoá** — chỉ không hiển thị trong lượt mới.
5. Nộp bài và nút “Làm lại” ở trang kết quả giữ nguyên hành vi xoá draft như hiện tại.
6. Header nav “Listening” / “Reading” vẫn được phép resume bài đang làm dở (không đổi).

## 4. Phạm vi triển khai

| Vị trí | Hành động | Draft xoá |
|---|---|---|
| Trang chủ — hero “Làm Listening →” (`src/app/page.tsx` ~dòng 109) | `onClick={() => clearDraft()}` trên `Link` | `cdr.draft.v1` |
| Trang chủ — card Listening “Làm Listening” (~dòng 197) | `onClick={() => clearDraft()}` | `cdr.draft.v1` |
| Hub Reading — hero “Bắt đầu làm bài →” (`src/app/reading/page.tsx` ~dòng 65) | `onClick={() => clearDraft()}` | `cdr.reading.draft.v1` |
| `/practice` (`src/app/practice/page.tsx`) | Effect đối chiếu draft mỗi lần trang hiển thị; reset state khi không có draft | `cdr.draft.v1` (draft rỗng) |
| `/reading/practice` (`src/app/reading/practice/page.tsx`) | Effect đối chiếu draft mỗi lần trang hiển thị; reset state khi không có draft | `cdr.reading.draft.v1` (draft rỗng) |
| Header nav “Listening” / “Reading” | Không đổi — đây là điều hướng khu vực, được phép khôi phục bài đang làm dở | — |
| Trang chủ — “Làm Reading” | Không đổi — chỉ mở hub Reading; hub mới là nơi bắt đầu | — |
| `/results` “Làm lại”, `/reading/results` “Làm lại” | Đã xoá draft sẵn; nhờ effect đối chiếu nên cũng bắt đầu sạch | — |

## 5. Ngoài phạm vi

- Không thêm hộp thoại xác nhận “bạn sẽ mất bài đang làm dở”.
- Không đổi cấu trúc localStorage, không đổi logic chấm điểm.
- Không xoá lịch sử / “đã nắm”.
- Không đổi giao diện, không thêm dependency.
- Không đổi thời lượng 45:00 / 75:00 của lượt làm bài.

## 6. Tiêu chí chấp nhận

1. **Luồng Founder (bắt buộc):** `/practice` → chọn 1 đáp án + đánh dấu 1 câu → nộp bài → `/results` → về trang chủ bằng SPA → bấm “Làm Listening →” → `/practice` hiển thị **0 đáp án được chọn, 0 cờ, timer 45:00**, draft rỗng/không có.
2. **Không chỉ seed draft:** làm dở bài (chưa nộp), về trang chủ, bấm “Làm Listening →” → lượt mới sạch tương tự mục 1.
3. Tương tự với nút “Làm Listening” ở card module (điểm vào thứ 2).
4. **Reading:** `/reading/practice` → làm 1 câu + đánh dấu 1 câu → nộp → `/reading/results` → về hub `/reading` → bấm “Bắt đầu làm bài →” → **0 đáp án, 0 cờ, timer 75:00**, draft rỗng/không có.
5. **Resume không hồi quy:** đang làm dở, về trang chủ, bấm nav header “Listening” → đáp án/cờ đã làm vẫn được khôi phục.
6. **F5 không hồi quy:** trên trang practice, chọn 1 đáp án → F5 → đáp án vẫn được khôi phục.
7. Sau khi bấm CTA, `cdr.history.v1` / `cdr.reading.history.v1` vẫn còn nguyên số lần làm cũ; `cdr.mastered.v1` / `cdr.reading.mastered.v1` không đổi.
8. `npm run build` PASS; 0 console error / exception trên `/`, `/practice`, `/results`, `/reading`, `/reading/practice`, `/reading/results`.
9. **Dev Strict Mode:** chạy lại đúng luồng nộp bài → CTA trên dev server (`:3000`, Strict Mode bật mặc định) ít nhất 2 lần liên tiếp, mỗi lần đều phải sạch đáp án/cờ; không được chỉ pass trên production.

## 7. Ghi chú kỹ thuật

- Effect đối chiếu nên chạy trước khi browser paint lần hiển thị để tránh nháy đáp án cũ; dùng `useLayoutEffect` an toàn SSR (isomorphic: `typeof window !== "undefined" ? useLayoutEffect : useEffect`) hoặc cách tương đương.
- Dùng `freshResetRef`: bật `true` khi phát hiện không có draft (lượt mới), `false` khi khôi phục draft; auto-save effect bỏ qua ghi trong lượt mới. `selectAnswer`/`toggleFlag` đặt lại `false` ngay khi người dùng thao tác, nên draft chỉ bắt đầu được lưu từ lựa chọn thật của người dùng. Cơ chế này làm effect chạy 2 lần ở StrictMode vẫn idempotent.
- Không dùng `router.bfcacheId` làm key toàn trang: tài liệu Next khuyến nghị chỉ dùng như giải pháp cuối; cách đúng là reset state theo dữ liệu (draft).
- Harness kiểm chứng phải lọc phần tử **đang hiển thị** vì DOM của route bị Activity ẩn vẫn nằm trong document.

## 8. Ghi chú cho Founder

Nút “Làm Listening” là hành động **bắt đầu lượt mới**, nên draft đang làm dở (nếu có) sẽ bị bỏ mà không hỏi lại — đúng yêu cầu “làm lại chứ không phải làm tiếp”. Lịch sử và trạng thái ôn tập vẫn còn để xem ở `/results` và `/review`.
