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
        {error.message || "支払いデータの読み込みに失敗しました"}
      </p>
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
