"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Calendar, BarChart3, Menu } from "lucide-react";

const navLinks = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/payments", label: "支払い", icon: Receipt },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/reports", label: "レポート", icon: BarChart3 },
  { href: "/menu", label: "メニュー", icon: Menu },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background">
      <div className="grid grid-cols-5">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
              isActive(href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
