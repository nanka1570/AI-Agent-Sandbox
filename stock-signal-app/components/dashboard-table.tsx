"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SECTORS } from "@/lib/constants/nasdaq100";
import type { SerializedSignal, StockSummary } from "@/lib/queries";

interface Props {
  summaries: StockSummary[];
}

type SignalFilter = "all" | "buy" | "sell";
type SortKey = "ticker" | "score";

export function DashboardTable({ summaries }: Props) {
  const [sector, setSector] = useState<string>("all");
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("ticker");

  const rows = useMemo(() => {
    let result = summaries;
    if (sector !== "all") {
      result = result.filter((s) => s.sector === sector);
    }
    if (signalFilter !== "all") {
      result = result.filter(
        (s) =>
          s.smaSignal?.type === signalFilter ||
          s.rsiSignal?.type === signalFilter
      );
    }
    if (sortKey === "score") {
      result = [...result].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    }
    return result;
  }, [summaries, sector, signalFilter, sortKey]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select
          aria-label="セクターで絞り込み"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-md border bg-white px-2 py-1.5"
        >
          <option value="all">全セクター</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="シグナルで絞り込み"
          value={signalFilter}
          onChange={(e) => setSignalFilter(e.target.value as SignalFilter)}
          className="rounded-md border bg-white px-2 py-1.5"
        >
          <option value="all">全シグナル</option>
          <option value="buy">買いシグナルあり</option>
          <option value="sell">売りシグナルあり</option>
        </select>
        <select
          aria-label="並び順"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border bg-white px-2 py-1.5"
        >
          <option value="ticker">ティッカー順</option>
          <option value="score">ファンダスコア順</option>
        </select>
        <span className="text-gray-500">{rows.length} 銘柄</span>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">ティッカー</th>
              <th className="px-3 py-2">銘柄名</th>
              <th className="px-3 py-2">セクター</th>
              <th className="px-3 py-2 text-right">終値（調整後）</th>
              <th className="px-3 py-2">SMA クロス</th>
              <th className="px-3 py-2">RSI</th>
              <th className="px-3 py-2 text-right">ファンダ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.ticker} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-medium">
                  <Link
                    href={`/stocks/${s.ticker}`}
                    className="text-blue-700 hover:underline"
                  >
                    {s.ticker}
                  </Link>
                </td>
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-gray-600">{s.sector}</td>
                <td
                  className="px-3 py-2 text-right font-mono"
                  title={s.latestDate ? `${s.latestDate} 時点` : undefined}
                >
                  {s.latestAdjClose != null
                    ? `$${s.latestAdjClose.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  {s.hasEnoughData ? (
                    <SignalBadge signal={s.smaSignal} />
                  ) : (
                    <span className="text-xs text-gray-400">データ不足</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <SignalBadge signal={s.rsiSignal} />
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {s.score != null ? `${s.score}/5` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: SerializedSignal | null }) {
  if (!signal) {
    return <span className="text-xs text-gray-400">中立</span>;
  }
  const style =
    signal.type === "buy"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  return (
    <span
      title={`${signal.date}: ${signal.reason}`}
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {signal.type === "buy" ? "買い" : "売り"}
    </span>
  );
}
