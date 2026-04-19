"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth-actions";

const navLinks = [
  { href: "/", label: "司令部", code: "HQ" },
  { href: "/accounts", label: "金庫", code: "V" },
  { href: "/salary", label: "補給", code: "S" },
  { href: "/credit-cards", label: "札", code: "C" },
  { href: "/payments", label: "戦果", code: "R" },
  { href: "/calendar", label: "作戦暦", code: "O" },
  { href: "/budget", label: "予算", code: "B" },
  { href: "/reports", label: "戦況", code: "I" },
] as const;

export function HeaderNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b-2 border-[oklch(var(--sky-deep))] bg-[oklch(var(--background)/0.72)] backdrop-blur-xl">
      {/* 赤斜線ストライプ帯 */}
      <div className="red-stripe h-1 w-full opacity-60" />

      <div className="container mx-auto flex items-center gap-6 px-6 py-3">
        {/* ロゴ: SSS 家計部 */}
        <Link href="/" className="group flex items-center gap-3 shrink-0">
          <span
            aria-hidden
            className="relative inline-flex size-10 items-center justify-center bg-[oklch(var(--sky-deep))] transition-transform group-hover:-rotate-6"
            style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
          >
            <span className="font-display text-[11px] tracking-[0.15em] text-[oklch(var(--feather))]">
              SSS
            </span>
            <span
              aria-hidden
              className="absolute -right-1 -top-1 size-2 bg-[oklch(var(--sss))]"
            />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[18px] tracking-[0.05em] text-[oklch(var(--sky-deep))]">
              家計簿
            </span>
            <span className="font-hand text-[12px] leading-none text-[oklch(var(--sss))] -mt-0.5">
              Kakei! Battle Front
            </span>
          </div>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5">
          {navLinks.map(({ href, label, code }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-all ${
                  active
                    ? "text-[oklch(var(--feather))]"
                    : "text-[oklch(var(--sky-deep))] hover:text-[oklch(var(--sss))]"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-[oklch(var(--sky-deep))] sky-cut"
                  />
                )}
                <span
                  className={`font-display text-[9px] tracking-[0.15em] ${
                    active
                      ? "text-[oklch(var(--sss))]"
                      : "text-[oklch(var(--sky))]"
                  }`}
                >
                  {code}
                </span>
                <span className="font-jp">{label}</span>
              </Link>
            );
          })}
        </nav>

        <form
          action={async () => {
            await logout();
          }}
        >
          <button
            type="submit"
            className="group flex items-center gap-1.5 border border-[oklch(var(--sss))] px-3 py-1 font-display text-[11px] tracking-[0.15em] text-[oklch(var(--sss))] transition-colors hover:bg-[oklch(var(--sss))] hover:text-[oklch(var(--feather))]"
          >
            退場
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </form>
      </div>
    </header>
  );
}
