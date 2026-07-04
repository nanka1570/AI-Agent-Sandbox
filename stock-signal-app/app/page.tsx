import { DashboardTable } from "@/components/dashboard-table";
import { SyncPanel } from "@/components/sync-panel";
import { NASDAQ100 } from "@/lib/constants/nasdaq100";
import { getStockSummaries } from "@/lib/queries";

export const dynamic = "force-dynamic"; // 同期後に常に最新の DB を読む

export default async function DashboardPage() {
  const summaries = await getStockSummaries();
  const tickers = NASDAQ100.map((s) => s.ticker);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">NASDAQ-100 シグナル一覧</h1>
        <SyncPanel tickers={tickers} />
      </div>
      {summaries.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600">
          データがまだありません。「データ更新」を押して株価データを取得してください（初回は数分かかります）。
        </div>
      ) : (
        <DashboardTable summaries={summaries} />
      )}
    </div>
  );
}
