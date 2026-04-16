"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * 支払い管理ページのエラー UI
 */
export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PaymentsError:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-sm text-muted-foreground">
        支払いデータの読み込みに失敗しました
      </p>
      <p className="text-[10px] font-mono text-muted-foreground mt-2 max-w-xs break-all">
        {error.message || "(no message)"}
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
