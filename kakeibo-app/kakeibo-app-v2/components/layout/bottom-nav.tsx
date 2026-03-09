"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Wallet, Tag, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: Home },
  { href: "/payments", label: "支払い", icon: CreditCard },
  { href: "/salary", label: "手取り", icon: Wallet },
  { href: "/budget", label: "カテゴリ", icon: Tag },
  { href: "/reports", label: "レポート", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-secondary backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-bold transition-all ${
              isActive(href)
                ? "text-slime-cyan-bright"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="size-5" />
            {label}
            {isActive(href) && (
              <span className="absolute bottom-0 left-[20%] right-[20%] h-0.5 rounded-sm bg-gradient-to-r from-accent to-slime-purple" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
