import type { Metadata } from 'next';
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/layout/bottom-nav';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['700', '900'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '700'],
});

export const metadata: Metadata = {
  title: '家計簿アプリ',
  description: '給料日とクレジットカード支払日を管理する家計簿アプリ',
};

// ナビゲーションリンク定義（英語表記: design_spec.md準拠）
const navLinks = [
  { href: '/', label: 'DASHBOARD' },
  { href: '/credit-cards', label: 'CARDS' },
  { href: '/salary', label: 'SALARY' },
  { href: '/payments', label: 'PAYMENTS' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${spaceGrotesk.variable} antialiased`}>
        <header className="bg-background">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-border bg-white px-4 py-2 text-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              家計簿 APP
            </Link>
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
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pb-6">{children}</main>
        <BottomNav />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
