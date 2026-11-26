import { Suspense } from "react";
import ResultsClient from "./ResultsClient";
import { EXAM_DATE } from "@/data/exam";

export const metadata = {
  title: `Kết quả bài làm — LISTENING REVISION ${EXAM_DATE}`,
  description: "Xem điểm raw, điểm quy đổi ước lượng, phân tích từng Part và danh sách câu sai kèm transcript.",
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-page-enter flex min-h-screen items-center justify-center bg-paper">
          <p className="text-sm text-ink-soft">Đang tải kết quả…</p>
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
