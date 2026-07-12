"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, SignalTypeBadge } from "@/components/badge";
import { SECTORS } from "@/lib/constants/nasdaq100";
import type { SerializedSignal, StockSummary } from "@/lib/queries";

interface Props {
  summaries: StockSummary[];
}

type SignalFilter = "all" | "buy" | "sell" | "warning";
type SortKey = "ticker" | "return20d" | "fund";

export function DashboardTable({ summaries }: Props) {
  const [sector, setSector] = useState<string>("all");
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("ticker");

  const rows = useMemo(() => {
    let result = summaries;
    if (sector !== "all") {
      result = result.filter((s) => s.sector === sector);
    }
    if (signalFilter === "buy") {
      result = result.filter(
        (s) => s.shortSignal?.type === "buy" || s.volumeSurgeBullish
      );
    } else if (signalFilter === "sell") {
      result = result.filter((s) => s.shortSignal?.type === "sell");
    } else if (signalFilter === "warning") {
      result = result.filter(
        (s) =>
          s.kairiWarning ||
          s.volumeFadeAtHigh ||
          s.lowVolumeRally ||
          s.warningCount > 0 ||
          s.speculativeBuy
      );
    }
    if (sortKey === "return20d") {
      result = [...result].sort(
        (a, b) => (b.return20d ?? -Infinity) - (a.return20d ?? -Infinity)
      );
    } else if (sortKey === "fund") {
      const rate = (s: StockSummary) =>
        s.fundPassed != null && s.fundTotal ? s.fundPassed / s.fundTotal : -1;
      result = [...result].sort((a, b) => rate(b) - rate(a));
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
          className="rounded-md border bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
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
          className="rounded-md border bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">全シグナル</option>
          <option value="buy">買いサインあり</option>
          <option value="sell">売りサインあり</option>
          <option value="warning">警戒あり</option>
        </select>
        <select
          aria-label="並び順"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="ticker">ティッカー順</option>
          <option value="return20d">20日騰落順（相対強度）</option>
          <option value="fund">ファンダ合格率順</option>
        </select>
        <span className="text-gray-500 dark:text-gray-400">{rows.length} 銘柄</span>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-3 py-2">ティッカー</th>
              <th className="px-3 py-2">銘柄名</th>
              <th className="px-3 py-2 text-right">終値</th>
              <th className="px-3 py-2 text-right" title="セクター内の相対強度比較に使う">
                20日騰落
              </th>
              <th className="px-3 py-2" title="5/25日線GC・価格×25日線の直近シグナル">
                短期
              </th>
              <th className="px-3 py-2" title="200日線の上=長期上昇 / PO=パーフェクトオーダー">
                長期
              </th>
              <th className="px-3 py-2" title="出来高急増+大陽線 / 高値圏で出来高減 / 出来高を伴わない上昇">
                出来高
              </th>
              <th className="px-3 py-2 text-right" title="25日線乖離率。+15%以上は天井警戒">
                乖離
              </th>
              <th className="px-3 py-2" title="ボリンジャーバンド±2σ / 指数下落日の逆行高">
                BB/逆行
              </th>
              <th className="px-3 py-2 text-right" title="ファンダ合格数（⚠は警戒フラグ数）">
                ファンダ
              </th>
              <th className="px-3 py-2">タイプ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.ticker}
                className="border-b last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <td className="px-3 py-2 font-mono font-medium">
                  <Link
                    href={`/stocks/${s.ticker}`}
                    className="text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {s.ticker}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span title={s.sector}>{s.name}</span>
                </td>
                <td
                  className="px-3 py-2 text-right font-mono"
                  title={s.latestDate ? `${s.latestDate} 時点（調整後終値）` : undefined}
                >
                  {s.latestAdjClose != null
                    ? `$${s.latestAdjClose.toFixed(2)}`
                    : "—"}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${
                    s.return20d == null
                      ? ""
                      : s.return20d >= 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {s.return20d != null
                    ? `${s.return20d >= 0 ? "+" : ""}${s.return20d.toFixed(1)}%`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  {s.hasShortData ? (
                    <span className="inline-flex items-center gap-1">
                      <SignalBadge signal={s.shortSignal} />
                      {s.speculativeBuy && (
                        <Badge tone="orange" title="テクニカル買い × 業績赤字（Intel 型）= 投機と自覚する">投機</Badge>
                      )}
                    </span>
                  ) : (
                    <Muted>データ不足</Muted>
                  )}
                </td>
                <td className="px-3 py-2">
                  {s.longTrend == null ? (
                    <Muted>データ不足</Muted>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={
                          s.longTrend === "up"
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }
                        title="200日線に対する位置"
                      >
                        {s.longTrend === "up" ? "上昇" : "下落"}
                      </span>
                      {s.perfectOrder && (
                        <Badge tone="green" title="パーフェクトオーダー: 全MAが上向きに整列（強いトレンド継続）">PO</Badge>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {s.volumeSurgeBullish && (
                      <Badge tone="green" title="出来高急増 + 大陽線 = 強い買いのサイン">急増+陽線</Badge>
                    )}
                    {s.volumeFadeAtHigh && (
                      <Badge tone="orange" title="高値圏で出来高減少 = 買いの勢い低下（利確検討パターン）">高値圏で減</Badge>
                    )}
                    {s.lowVolumeRally && (
                      <Badge tone="orange" title="出来高を伴わない上昇 = 信頼しない">薄商い上昇</Badge>
                    )}
                    {!s.volumeSurgeBullish && !s.volumeFadeAtHigh && !s.lowVolumeRally && (
                      <Muted>—</Muted>
                    )}
                  </span>
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${
                    s.kairiWarning ? "font-bold text-orange-600 dark:text-orange-400" : ""
                  }`}
                  title={s.kairiWarning ? "25日線から大きく乖離 = 天井警戒" : "25日線乖離率"}
                >
                  {s.kairi25 != null
                    ? `${s.kairi25 >= 0 ? "+" : ""}${s.kairi25.toFixed(1)}%`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {s.bbPosition === "lower" && (
                      <Badge tone="green" title="ボリンジャーバンド-2σタッチ = 買い検討">BB下限</Badge>
                    )}
                    {s.bbPosition === "upper" && (
                      <Badge tone="orange" title="+2σタッチ = 買われすぎ警戒（ただし上限張り付きは強さの証明でもある）">BB上限</Badge>
                    )}
                    {s.counterTrendUp && (
                      <Badge tone="green" title="指数が下落した日に上昇 = 相対的に強い">逆行高</Badge>
                    )}
                    {s.bbPosition == null && !s.counterTrendUp && <Muted>—</Muted>}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {s.fundPassed != null ? (
                    <span>
                      {s.fundPassed}/{s.fundTotal}
                      {s.warningCount > 0 && (
                        <span
                          className="ml-1 text-orange-600 dark:text-orange-400"
                          title={`警戒フラグ ${s.warningCount} 件（詳細ページで確認）`}
                        >
                          ⚠{s.warningCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {s.stockType ?? "—"}
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
    return <Muted>中立</Muted>;
  }
  return (
    <SignalTypeBadge
      type={signal.type}
      title={`${signal.date}: ${signal.reason}`}
    />
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">{children}</span>
  );
}
