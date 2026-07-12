"use client";

import { useState, useTransition } from "react";
import { generateMemoDraft, saveMemo } from "@/app/stocks/[ticker]/actions";

interface Props {
  ticker: string;
  initialMemo: string;
  aiEnabled: boolean; // ANTHROPIC_API_KEY が設定されているか
}

// 国別売上・事業構成（装置販売 vs 保守サービス）など API で取れない情報の記録用
// AI 下書き: SEC EDGAR の年次報告書から Claude が抽出した内容を挿入する（保存は人間が確認してから）
export function MemoForm({ ticker, initialMemo, aiEnabled }: Props) {
  const [memo, setMemo] = useState(initialMemo);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [drafting, startDrafting] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await saveMemo(ticker, memo);
      setStatus(
        result.ok
          ? { kind: "saved" }
          : { kind: "error", message: result.error ?? "保存に失敗しました" }
      );
    });
  }

  function generateDraft() {
    startDrafting(async () => {
      const result = await generateMemoDraft(ticker);
      if (!result.ok || !result.draft) {
        setStatus({
          kind: "error",
          message: result.error ?? "下書きの生成に失敗しました",
        });
        return;
      }
      // 既存メモは消さず、下書きを末尾に追記する（採用するかは人間が編集して判断）
      setMemo((current) =>
        current.trim() === "" ? result.draft! : `${current}\n\n${result.draft}`
      );
      setStatus({ kind: "idle" });
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        aria-label="銘柄の手動メモ"
        value={memo}
        onChange={(e) => {
          setMemo(e.target.value);
          setStatus({ kind: "idle" }); // 編集を始めたら保存済み表示を消す
        }}
        rows={5}
        placeholder={
          "例:\n・中国売上比率: 12%（10-K 2025）→ リスク中\n・事業構成: 装置販売 7 割（景気変動大）/ 保守 3 割\n・幹部の売却: 2026-06 CEO が一部売却（高値圏で留意）"
        }
        className="w-full rounded-md border bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || drafting}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "保存中…" : "メモを保存"}
        </button>
        <button
          onClick={generateDraft}
          disabled={!aiEnabled || pending || drafting}
          title={
            aiEnabled
              ? "SEC EDGAR の最新の年次報告書（10-K 等）から国別売上・事業構成を AI が抽出して下書きを追記します"
              : "未設定: .env.local に ANTHROPIC_API_KEY を設定すると使えます（docs/maintenance.md 参照）"
          }
          className="rounded-md border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950"
        >
          {drafting ? "10-K を分析中…（30秒ほど）" : "AI で下書きを生成"}
        </button>
        {!aiEnabled && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            AI 下書きは未設定（ANTHROPIC_API_KEY を設定すると有効）
          </span>
        )}
        {status.kind === "saved" && (
          <span className="text-sm text-green-700 dark:text-green-400">
            保存しました
          </span>
        )}
        {status.kind === "error" && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
