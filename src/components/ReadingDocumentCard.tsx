"use client";

import type { AnswerKey } from "@/data/exam";
import type { ReadingBlock, ReadingDocument } from "@/data/reading";

export interface ReadingDocumentCardProps {
  doc: ReadingDocument;
  /** Xử lý chỗ trống {{n}} — chỉ dùng cho Part 6 (câu hỏi nằm ngay dưới). */
  onBlank?: (num: number) => void;
  /** Số đã chọn tại mỗi chỗ trống — để chip hiển thị chữ cái đã chọn. */
  chosen?: (num: number) => AnswerKey | undefined;
}

/** Tách đoạn văn thành các nhóm: text thường + token {{n}} (chỗ trống Part 6) / [n] (marker Part 7). */
export function readingTextChunks(text: string): { text: string; token: boolean }[] {
  const chunks: { text: string; token: boolean }[] = [];
  for (const part of text.split(/(\{\{\d+\}\}|\[\d\])/g)) {
    if (!part) continue;
    const token = (part.startsWith("{{") && part.endsWith("}}")) || /^\[\d\]$/.test(part);
    chunks.push({ text: part, token });
  }
  return chunks;
}

function renderText(text: string, onBlank?: (n: number) => void, chosen?: (n: number) => AnswerKey | undefined) {
  const chunks = readingTextChunks(text);
  return (
    <>
      {chunks.map((c, i) => {
        if (!c.token) return <span key={i}>{c.text}</span>;
        const num = Number(c.text.replace(/[^0-9]/g, ""));
        if (onBlank) {
          const val = chosen?.(num);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onBlank(num)}
              title={`Câu ${num} — chỗ trống`}
              aria-label={`Câu ${num}, chỗ trống${val ? `, đã chọn ${val}` : ""}`}
              className="mx-0.5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-brand/40 bg-brand-soft px-1.5 py-0.5 text-[12px] font-bold text-brand-dark transition-shadow hover:shadow-card"
            >
              {val ? `${num} · ${val}` : num}
            </button>
          );
        }
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex min-h-[22px] items-center rounded border border-line bg-paper-deep px-1.5 py-0.5 text-[11px] font-bold text-ink"
          >
            <span className="sr-only">Vị trí </span>
            [{num}]
          </span>
        );
      })}
    </>
  );
}

function BlockRenderer({ block, onBlank, chosen }: { block: ReadingBlock; onBlank?: (n: number) => void; chosen?: (n: number) => AnswerKey | undefined }) {
  switch (block.type) {
    case "title":
      return <h3 className="mt-5 font-display text-lg font-bold text-ink">{block.text}</h3>;
    case "subtitle":
      return <h4 className="mt-3 font-semibold text-ink">{block.text}</h4>;
    case "meta":
      return <ul className="mt-2 text-[11px] text-ink-soft">{block.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>;
    case "paragraph":
      return <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-7 text-ink">{renderText(block.text, onBlank, chosen)}</p>;
    case "list": {
      const items = block.items.map((item) => (block.ordered ? item.replace(/^\d+[.、)]\s+/, "") : item));
      if (block.ordered) {
        return (
          <ol className="mt-2.5 list-decimal space-y-1 pl-5 text-[15px] leading-7 text-ink" role="list">
            {items.map((t, i) => (
              <li key={i} className="mt-1.5 text-ink">{t}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="mt-2.5 list-disc space-y-1 pl-5 text-[15px] leading-7 text-ink">
          {items.map((t, i) => (
            <li key={i} className="mt-1.5 text-ink">{t}</li>
          ))}
        </ul>
      );
    }
    case "email":
      return (
        <div className="mt-2.5 rounded-xl border border-line bg-paper-deep/50 p-3">
          {(
            [
              ["To", block.to],
              ["From", block.from],
              ["Date", block.date],
              ["Subject", block.subject],
            ] as const
          )
            .filter(([, v]) => Boolean(v))
            .map(([k, v]) => (
              <p key={k} className="text-[11px]">
                <span className="font-bold uppercase tracking-wide text-ink-soft">{k}: </span>
                <span className="font-bold text-ink">{v}</span>
              </p>
            ))}
          {block.body.map((line, i) => (
            <p key={i} className="mt-1 whitespace-pre-wrap text-[15px] leading-7 text-ink">
              {renderText(line, onBlank, chosen)}
            </p>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="mt-2.5 min-w-0 max-w-full overflow-x-auto rounded-xl border border-line [overflow-wrap:normal]">
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-soft">
                {block.headers.map((h) => (
                  <th key={h} className="py-2 pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2.5 pr-6 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "box":
      return (
        <div className="mt-2.5 rounded-xl border border-line bg-paper-deep/60 p-3 text-[15px] text-ink">
          {block.label && <p className="mb-1.5 font-bold uppercase tracking-wide text-ink-soft">{block.label}</p>}
          {block.lines.map((l, i) => (
            <p key={i} className="text-ink">
              {l}
            </p>
          ))}
        </div>
      );
    case "quote":
      return (
        <div className="mt-2.5 rounded-r-lg border-l-3 border-accent bg-accent-soft/30 p-3 text-[15px] italic text-ink">
          <p>{block.text}</p>
          {block.attribution && (
            <p className="mt-1 text-xs font-semibold text-accent-dark not-italic">{block.attribution}</p>
          )}
        </div>
      );
    case "chat":
      return (
        <div className="mt-2.5 flex flex-col gap-1 rounded-lg border border-line/40 bg-paper-deep/50 p-3 text-[15px] text-ink">
          <p>
            <span className="font-semibold text-ink">{block.author}</span>{" "}
            <span className="text-xs text-ink-soft">{block.time}</span>
          </p>
          <p className="mt-0.5 leading-7">{block.text}</p>
        </div>
      );
    case "divider":
      return <hr className="my-4 border-line" />;
  }
}

export default function ReadingDocumentCard({ doc, onBlank, chosen }: ReadingDocumentCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white px-4 py-3 shadow-card [overflow-wrap:anywhere]">
      {doc.title && <h4 className="font-display text-base font-bold text-ink">{doc.title}</h4>}
      {doc.subtitle && <p className="mt-0.5 text-xs font-semibold text-ink-soft">{doc.subtitle}</p>}
      {(doc.meta ?? []).map((line, i) => (
        <p key={i} className="text-[11px] text-ink-soft">
          {line}
        </p>
      ))}
      {doc.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} onBlank={onBlank} chosen={chosen} />
      ))}
    </div>
  );
}
