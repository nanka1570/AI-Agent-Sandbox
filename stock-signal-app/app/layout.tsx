import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Signal - 米国テック株シグナル",
  description:
    "NASDAQ-100 銘柄の売買タイミングをテクニカル指標で提示する学習・分析用ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              Stock Signal
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ダッシュボード
            </Link>
            <Link
              href="/backtest"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              バックテスト
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t bg-white">
          <p className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500">
            本アプリは学習・分析用ツールです。表示されるシグナルは過去データに基づく参考情報であり、投資判断はご自身の責任で行ってください。
          </p>
        </footer>
      </body>
    </html>
  );
}
