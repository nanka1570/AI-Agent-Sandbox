"use client";

import { useState, useTransition } from "react";
import { saveMemo } from "@/app/stocks/[ticker]/actions";

interface Props {
  ticker: string;
  initialMemo: string;
}

// 国別売上・事業構成（装置販売 vs 保守サービス）など API で取れない情報の記録用
export function MemoForm({ ticker, initialMemo }: Props) {
  const [memo, setMemo] = useState(initialMemo);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await saveMemo(ticker, memo);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={5}
        placeholder={
          "例:\n・中国売上比率: 12%（10-K 2025）→ リスク中\n・事業構成: 装置販売 7 割（景気変動大）/ 保守 3 割\n・幹部の売却: 2026-06 CEO が一部売却（高値圏で留意）"
        }
        className="w-full rounded-md border bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "保存中…" : "メモを保存"}
        </button>
        {saved && (
          <span className="text-sm text-green-700 dark:text-green-400">
            保存しました
          </span>
        )}
      </div>
    </div>
  );
}
