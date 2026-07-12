import { DashboardTable } from "@/components/dashboard-table";
import { SyncPanel } from "@/components/sync-panel";
import { ALL_STOCKS, BENCHMARK } from "@/lib/constants/nasdaq100";
import { getVix, VIX_PANIC_LEVEL } from "@/lib/data/market";
import { getStockSummaries } from "@/lib/queries";

export const dynamic = "force-dynamic"; // 同期後に常に最新の DB を読む

export default async function DashboardPage() {
  const [summaries, vix] = await Promise.all([getStockSummaries(), getVix()]);
  // ベンチマーク（QQQ）も一緒に同期する（逆行高の判定に使う）
  const tickers = [...ALL_STOCKS.map((s) => s.ticker), BENCHMARK.ticker];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl font-bold">米国テック株シグナル一覧</h1>
          {vix != null && (
            <span
              className={`text-sm font-mono ${
                vix >= VIX_PANIC_LEVEL
                  ? "font-bold text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              title="VIX 30 以上 = 市場パニック（かつ長期目線では買い場になりうる）"
            >
              VIX {vix.toFixed(1)}
              {vix >= VIX_PANIC_LEVEL && "（パニック水準）"}
            </span>
          )}
        </div>
        <SyncPanel tickers={tickers} />
      </div>
      {summaries.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          データがまだありません。「データ更新」を押して株価データを取得してください（初回は数分かかります）。
        </div>
      ) : (
        <DashboardTable summaries={summaries} />
      )}
    </div>
  );
}
