"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
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
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">エラーが発生しました</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        ダッシュボードの読み込み中にエラーが発生しました。
        もう一度お試しください。
      </p>
      <Button onClick={reset} variant="outline">
        もう一度試す
      </Button>
    </div>
  );
}
