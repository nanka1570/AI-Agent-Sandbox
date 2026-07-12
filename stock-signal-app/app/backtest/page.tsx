"use client";

import { useState } from "react";
import { NASDAQ100 } from "@/lib/constants/nasdaq100";
import type { BacktestResult } from "@/lib/backtest/run";

// API から返る JSON は Date が文字列になる
type SerializedResult = Omit<BacktestResult, "trades"> & {
  trades: {
    buyDate: string;
    buyPrice: number;
    sellDate: string | null;
    sellPrice: number | null;
    returnPct: number | null;
  }[];
};

function defaultFrom(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 3);
  return d.toISOString().slice(0, 10);
}

export default function BacktestPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [rule, setRule] = useState<"sma-cross" | "price-cross" | "rsi">(
    "sma-cross"
  );
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SerializedResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, rule, from, to }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "バックテストに失敗しました");
      } else {
        setResult(json);
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">バックテスト</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        選んだルールに過去データで従っていた場合の成績を、同期間の Buy &amp;
        Hold（買って持ち続ける）と比較します。約定はシグナル当日の調整後終値で行う簡易モデルで、手数料・スリッページ・税も考慮しないため、実際の成績より楽観的になります。
      </p>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">銘柄</span>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="rounded-md border px-2 py-1.5 font-mono dark:border-gray-600 dark:bg-gray-800"
          >
            {NASDAQ100.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">ルール</span>
          <select
            value={rule}
            onChange={(e) => setRule(e.target.value as typeof rule)}
            className="rounded-md border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="sma-cross">ゴールデンクロス（5日/25日線）</option>
            <option value="price-cross">価格×25日線クロス</option>
            <option value="rsi">RSI（30 買い / 70 売り）</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">開始日</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">終了日</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "実行中…" : "実行"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric
              label="戦略リターン"
              value={`${result.totalReturnPct.toFixed(1)}%`}
              highlight={result.totalReturnPct >= result.buyHoldReturnPct}
            />
            <Metric
              label="Buy & Hold"
              value={`${result.buyHoldReturnPct.toFixed(1)}%`}
            />
            <Metric
              label="勝率"
              value={
                result.winRate != null ? `${result.winRate.toFixed(0)}%` : "—"
              }
            />
            <Metric label="取引回数" value={`${result.tradeCount} 回`} />
            <Metric
              label="最大ドローダウン"
              value={`-${result.maxDrawdownPct.toFixed(1)}%`}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-2">買い日</th>
                  <th className="px-3 py-2 text-right">買値</th>
                  <th className="px-3 py-2">売り日</th>
                  <th className="px-3 py-2 text-right">売値</th>
                  <th className="px-3 py-2 text-right">損益</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      期間内に取引はありませんでした
                    </td>
                  </tr>
                )}
                {result.trades.map((t, i) => (
                  <tr key={i} className="border-b last:border-b-0 dark:border-gray-800">
                    <td className="px-3 py-2">{t.buyDate.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${t.buyPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {t.sellDate ? t.sellDate.slice(0, 10) : "保有中"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {t.sellPrice != null ? `$${t.sellPrice.toFixed(2)}` : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${
                        t.returnPct == null
                          ? ""
                          : t.returnPct >= 0
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {t.returnPct != null
                        ? `${t.returnPct >= 0 ? "+" : ""}${t.returnPct.toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-3 dark:border-gray-700 dark:bg-gray-900 ${
        highlight
          ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
          : ""
      }`}
    >
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}
