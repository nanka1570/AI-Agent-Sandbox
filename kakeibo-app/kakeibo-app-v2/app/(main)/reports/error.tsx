"use client";

import { Button } from "@/components/ui/button";

export default function ReportsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <p className="text-sm text-muted-foreground">
        レポートの読み込みに失敗しました
      </p>
      <Button variant="outline" onClick={() => reset()}>
        再試行
      </Button>
    </div>
  );
}
