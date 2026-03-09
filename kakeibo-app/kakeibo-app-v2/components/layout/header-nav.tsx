"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Wallet,
  Receipt,
  Tag,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth-actions";

const navLinks = [
  { href: "/", label: "ダッシュボード", icon: Home },
  { href: "/credit-cards", label: "クレカ管理", icon: CreditCard },
  { href: "/salary", label: "手取り管理", icon: Wallet },
  { href: "/payments", label: "支払い管理", icon: Receipt },
  { href: "/budget", label: "カテゴリ", icon: Tag },
  { href: "/reports", label: "レポート", icon: BarChart3 },
] as const;

export function HeaderNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40">
      <div className="flex items-center justify-between bg-secondary border-b border-border px-6 py-3">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-slime-purple flex items-center justify-center text-sm font-black text-white shadow-[0_0_12px_rgba(6,147,227,0.3)]">
            転
          </div>
          <div>
            <p className="font-bold text-sm text-foreground tracking-wider">転スラ家計簿</p>
            <p className="font-mono text-[9px] text-muted-foreground tracking-[0.15em]">TENSURA KAKEIBO</p>
          </div>
        </Link>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold tracking-wider transition-all ${
                isActive(href)
                  ? "text-slime-cyan-bright bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-sm bg-gradient-to-r from-accent to-slime-purple" />
              )}
            </Link>
          ))}
        </nav>

        {/* ログアウト */}
        <form action={async () => { await logout(); }}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" />
            ログアウト
          </Button>
        </form>
      </div>
    </header>
  );
}
