"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ReportsError:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <p className="text-sm text-muted-foreground">
        レポートの読み込みに失敗しました
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-muted-foreground mt-2">
          Error ID: {error.digest}
        </p>
      )}
      <Button variant="outline" onClick={reset}>
        再試行
      </Button>
    </div>
  );
}
