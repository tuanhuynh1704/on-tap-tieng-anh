import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { EXAM_DATE } from "@/data/exam";

export const metadata: Metadata = {
  title: `Ôn tập TOEIC Listening + Reading — TOEIC REVISION ${EXAM_DATE}`,
  description:
    `Luyện đề TOEIC REVISION ${EXAM_DATE}: 100 câu Listening (ảnh, hỏi đáp, hội thoại, bài nói) + 100 câu Reading (Part 5–7). Làm bài Listening 45 phút / Reading 75 phút, chấm điểm, quy đổi ước lượng, ôn tập có đáp án.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
