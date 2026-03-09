"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * ダッシュボードのエラーバウンダリ
 * エラー発生時にリトライボタンを表示する
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ダッシュボードエラー:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="sage-voice max-w-md w-full">
        <p className="text-[13px] leading-relaxed text-sage-text">
          <span className="text-destructive font-bold">警告。</span>
          データ解析中にエラーが発生しました。再試行してください。
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="mt-2">
        再試行
      </Button>
    </div>
  );
}
