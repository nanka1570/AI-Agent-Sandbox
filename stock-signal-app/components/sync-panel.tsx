"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  tickers: string[];
}

// 「1 リクエスト = 1 銘柄」で直列に同期し、完了数を進捗として表示する
export function SyncPanel({ tickers }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);

  async function sync(targets: string[]) {
    setRunning(true);
    setDone(0);
    setFailed([]);
    const errors: string[] = [];
    let completed = 0;

    for (const ticker of targets) {
      try {
        const res = await fetch(`/api/sync/${ticker}`, { method: "POST" });
        if (!res.ok) errors.push(ticker);
      } catch {
        errors.push(ticker);
      }
      completed++;
      setDone(completed);
      setFailed([...errors]);
    }

    setRunning(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {running && (
        <span className="text-sm text-gray-600">
          同期中… {done}/{tickers.length}
        </span>
      )}
      {!running && failed.length > 0 && (
        <span className="text-sm text-red-600">
          失敗: {failed.join(", ")}
        </span>
      )}
      {!running && failed.length > 0 && (
        <button
          onClick={() => sync(failed)}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
        >
          失敗分を再実行
        </button>
      )}
      <button
        onClick={() => sync(tickers)}
        disabled={running}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? "同期中…" : "データ更新"}
      </button>
    </div>
  );
}
