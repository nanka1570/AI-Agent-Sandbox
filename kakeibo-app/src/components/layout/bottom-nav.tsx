"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Banknote, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "HOME", icon: LayoutDashboard },
  { href: "/credit-cards", label: "CARDS", icon: CreditCard },
  { href: "/salary", label: "SALARY", icon: Banknote },
  { href: "/payments", label: "PAYMENTS", icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-background md:hidden">
      <ul className="flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
