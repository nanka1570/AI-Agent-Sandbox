import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Zen_Maru_Gothic } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "kakeibo",
  description: "手取りでクレカ代が払えるか一目でわかる家計簿アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} ${zenMaruGothic.variable} antialiased`}>
        <div className="comic-bg" aria-hidden="true">
          <div className="comic-burst" />
        </div>
        <div className="relative z-10">
          {children}
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
