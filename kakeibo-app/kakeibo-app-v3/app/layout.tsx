import type { Metadata } from "next";
import {
  RocknRoll_One,
  Zen_Kaku_Gothic_Antique,
  Caveat,
  DM_Serif_Display,
} from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const rocknroll = RocknRoll_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_Antique({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-numeric",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "家計簿 SSS — 使えるお金を可視化",
  description: "死んだ世界戦線・家計部: 銀行残高 + 手取り − 全支払い = 使えるお金",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${rocknroll.variable} ${zenKaku.variable} ${caveat.variable} ${dmSerif.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
