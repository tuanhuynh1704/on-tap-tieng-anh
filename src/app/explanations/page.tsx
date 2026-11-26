import type { Metadata } from "next";
import QuestionExplanationExplorer from "@/components/QuestionExplanationExplorer";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Giải thích 200 câu Listening & Reading — TOEIC REVISION",
  description: "Tra cứu bản dịch, đáp án và hướng dẫn giải cho từng câu Listening và Reading.",
};

export default function ExplanationsPage() {
  return (
    <div className="animate-page-enter flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <QuestionExplanationExplorer />
      </main>
    </div>
  );
}
