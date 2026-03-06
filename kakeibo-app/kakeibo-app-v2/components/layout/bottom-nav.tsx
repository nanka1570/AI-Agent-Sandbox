"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Wallet, Tag } from "lucide-react";

/** モバイル用ボトムナビゲーションの項目定義 */
const navItems = [
  { href: "/", label: "ダッシュボード", icon: Home },
  { href: "/payments", label: "支払い", icon: CreditCard },
  { href: "/salary", label: "手取り", icon: Wallet },
  { href: "/budget", label: "カテゴリ", icon: Tag },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  /** パスがアクティブかどうかを判定する */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-3 border-foreground bg-white md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-bold transition-all ${
              isActive(href)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
