import { Suspense } from "react";
import ReadingResultsClient from "./ReadingResultsClient";

export const metadata = {
  title: "Kết quả bài làm — READING REVISION",
  description: "Xem điểm raw, điểm quy đổi 5–495 ước lượng, phân tích từng Part (5/6/7) và danh sách câu sai kèm đoạn văn gốc.",
};

export default function ReadingResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper">
          <p className="text-sm text-ink-soft">Đang tải kết quả…</p>
        </div>
      }
    >
      <ReadingResultsClient />
    </Suspense>
  );
}
