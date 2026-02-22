"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="border-2 border-border bg-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-black">エラーが発生しました</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={() => reset()}>
          再読み込み
        </Button>
      </div>
    </div>
  );
}
