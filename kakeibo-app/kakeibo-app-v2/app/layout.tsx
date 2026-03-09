import type { Metadata } from "next";
import { M_PLUS_1, Share_Tech_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const mplus1 = M_PLUS_1({
  variable: "--font-mplus1",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const sharetech = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "大賢者 家計解析 | 転スラ家計簿",
  description: "手取りでクレカ代が払えるか一目でわかる家計簿アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${mplus1.variable} ${sharetech.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
