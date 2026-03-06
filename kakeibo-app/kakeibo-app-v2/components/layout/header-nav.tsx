"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Wallet,
  Receipt,
  Tag,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth-actions";

/** PC用ナビゲーションリンクの定義 */
const navLinks = [
  { href: "/", label: "ダッシュボード", icon: Home },
  { href: "/credit-cards", label: "クレカ管理", icon: CreditCard },
  { href: "/salary", label: "手取り管理", icon: Wallet },
  { href: "/payments", label: "支払い管理", icon: Receipt },
  { href: "/budget", label: "カテゴリ", icon: Tag },
] as const;

export function HeaderNav() {
  const pathname = usePathname();

  /** パスがアクティブかどうかを判定する */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:flex items-center justify-between border-b-3 border-foreground bg-white sticky top-0 z-40 px-6 py-3">
      {/* ロゴ */}
      <Link href="/" className="font-[family-name:var(--font-zen-maru)] text-xl font-bold text-primary uppercase tracking-wider">
        kakeibo
      </Link>

      {/* ナビゲーションリンク */}
      <nav className="flex items-center gap-1">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
              isActive(href)
                ? "bg-secondary text-foreground border-2 border-foreground shadow-[2px_2px_0px_oklch(0.50_0.01_280)]"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* ログアウトボタン */}
      <form
        action={async () => {
          await logout();
        }}
      >
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="size-4" />
          ログアウト
        </Button>
      </form>
    </header>
  );
}
