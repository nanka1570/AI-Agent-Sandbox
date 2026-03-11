import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SwRegister } from '@/components/pwa/sw-register';
import './globals.css';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

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
  description: '手取りでクレカ代が払えるかチェックする家計簿アプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '家計簿 APP',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${notoSansJP.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
        <SwRegister />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
