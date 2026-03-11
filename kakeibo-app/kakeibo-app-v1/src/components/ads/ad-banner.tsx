"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

/**
 * Google AdSense バナー
 * 環境変数が設定されている場合は実際の広告を表示し、
 * 未設定の場合はプレースホルダーを表示する。
 *
 * 必要な環境変数:
 * - NEXT_PUBLIC_ADSENSE_CLIENT_ID: AdSense クライアントID（例: ca-pub-1234567890）
 * - NEXT_PUBLIC_ADSENSE_SLOT_ID: 広告ユニットのスロットID
 */
export function AdBanner() {
  useEffect(() => {
    if (ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // 広告ブロッカー等による失敗は無視
      }
    }
  }, []);

  if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) {
    return (
      <div className="my-4 flex h-[90px] items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-muted/50 text-xs text-muted-foreground">
        広告スペース
      </div>
    );
  }

  return (
    <div className="my-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
