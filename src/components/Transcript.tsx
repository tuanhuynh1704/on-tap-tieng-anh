import { CUE_SPLIT, CUE_TEST } from "@/data/exam";

const SPEAKER_PREFIX = /^(M-[A-Za-z]+|W-[A-Za-z]+):\s*/;

/** Render transcript: mỗi dòng 1 lượt thoại; cue (n) được highlight nền vàng. */
export default function Transcript({ transcript }: { transcript: string }) {
  const lines = transcript.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="min-w-0 rounded-xl border border-line bg-white/70 p-3 text-sm leading-6 text-ink">
      {lines.map((line, i) => {
        const m = line.match(SPEAKER_PREFIX);
        const speaker = m?.[1] ?? null;
        const body = m ? line.slice(m[0].length) : line;
        const parts = body.split(CUE_SPLIT);
        return (
          <p key={i} className="min-w-0 py-1 flex gap-2">
            {speaker && (
              <span
                className={`shrink-0 inline-flex items-start justify-center rounded px-1.5 text-[11px] font-bold leading-5 h-5 mt-0.5 ${
                  speaker.startsWith("M-") ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {speaker}
              </span>
            )}
            <span className="min-w-0 break-words">
              {parts.map((part, j) =>
                CUE_TEST.test(part) ? (
                  <mark key={j} className="cue">
                    {part}
                  </mark>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </span>
          </p>
        );
      })}
    </div>
  );
}
