import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/layout/logout-button";

// ナビゲーションリンク定義
const navLinks = [
  { href: "/", label: "ダッシュボード" },
  { href: "/credit-cards", label: "カード" },
  { href: "/salary", label: "給料" },
  { href: "/payments", label: "支払い" },
  { href: "/budget", label: "カテゴリ / 予算" },
  { href: "/reports", label: "レポート" },
];

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="bg-background">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-border bg-white px-4 py-2 text-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            家計簿 APP
          </Link>
          <div className="flex items-center gap-3">
            <ul className="hidden gap-3 md:flex">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block border-2 border-border bg-white px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-secondary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pb-6">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-24 md:pb-8">
        <div className="flex items-center justify-center gap-4 border-t-2 border-border pt-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">利用規約</Link>
        </div>
      </footer>
      <BottomNav />
    </>
  );
}
