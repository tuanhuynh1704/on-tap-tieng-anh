"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Trang chủ", match: (p: string) => p === "/" },
  {
    href: "/practice",
    label: "Listening",
    match: (p: string) => p === "/practice" || p === "/results" || p === "/review",
  },
  {
    href: "/reading",
    label: "Reading",
    match: (p: string) => p === "/reading" || p.startsWith("/reading/"),
  },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="TOEIC REVISION — Trang chủ">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            TR
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-wide text-ink">TOEIC REVISION</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              LISTENING · READING · 28/11/2026
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-md px-2 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
                  active ? "text-brand-dark" : "text-ink-soft hover:text-brand-dark"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-brand sm:inset-x-3"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
