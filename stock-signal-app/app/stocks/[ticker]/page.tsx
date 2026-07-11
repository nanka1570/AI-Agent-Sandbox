import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { sma } from "@/lib/indicators/sma";
import { rsi } from "@/lib/indicators/rsi";
import {
  SMA_LONG_PERIOD,
  SMA_SHORT_PERIOD,
  type Signal,
} from "@/lib/signals/evaluate";
import { getStockDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({
  params,
}: PageProps<"/stocks/[ticker]">) {
  const { ticker } = await params;
  const detail = await getStockDetail(ticker.toUpperCase());
  if (!detail) notFound();

  const { stock, prices, smaSignals, rsiSignals, fundamentalScore } = detail;

  const values = prices.map((p) => p.adjClose);
  const sma50 = sma(values, SMA_SHORT_PERIOD);
  const sma200 = sma(values, SMA_LONG_PERIOD);
  const rsi14 = rsi(values, 14);

  const chartData: ChartPoint[] = prices.map((p, i) => ({
    date: p.date.toISOString().slice(0, 10),
    adjClose: round2(p.adjClose),
    sma50: sma50[i] != null ? round2(sma50[i]) : null,
    sma200: sma200[i] != null ? round2(sma200[i]) : null,
    rsi: rsi14[i] != null ? round2(rsi14[i]) : null,
  }));

  const recentSignals = [...smaSignals, ...rsiSignals]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-blue-700 hover:underline dark:text-blue-400"
        >
          ← ダッシュボードに戻る
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          <span className="font-mono">{stock.ticker}</span> — {stock.name}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            {stock.sector}
          </span>
        </h1>
      </div>

      {prices.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          価格データがありません。ダッシュボードの「データ更新」を実行してください。
        </div>
      ) : (
        <PriceChart data={chartData} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-bold">
            直近のシグナル（新しい順・最大10件）
          </h2>
          {recentSignals.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">シグナル履歴はありません。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <SignalLabel signal={s} />
                  <span className="text-gray-500 dark:text-gray-400">
                    {s.date.toISOString().slice(0, 10)}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{s.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-bold">
            ファンダメンタルズスコア{" "}
            {fundamentalScore
              ? `${fundamentalScore.score}/${fundamentalScore.max}`
              : "（未取得）"}
          </h2>
          {fundamentalScore ? (
            <ul className="space-y-1.5 text-sm">
              {fundamentalScore.items.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span>
                    {!item.available ? "⚪" : item.passed ? "✅" : "❌"}
                  </span>
                  <span
                    className={item.available ? "" : "text-gray-400 dark:text-gray-500"}
                  >
                    {item.label}
                    {!item.available && "（取得不能）"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              「データ更新」を実行すると取得されます。
            </p>
          )}
          <FundamentalTable detail={detail} />
        </section>
      </div>
    </div>
  );
}

function SignalLabel({ signal }: { signal: Signal }) {
  const style =
    signal.type === "buy"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${style}`}
    >
      {signal.type === "buy" ? "買い" : "売り"}
    </span>
  );
}

function FundamentalTable({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getStockDetail>>>;
}) {
  const f = detail.stock.fundamental;
  if (!f) return null;
  const rows: [string, number | null, (v: number) => string][] = [
    ["実績 PER", f.per, (v) => v.toFixed(1)],
    ["予想 PER", f.forwardPer, (v) => v.toFixed(1)],
    ["PEG", f.peg, (v) => v.toFixed(2)],
    ["収益成長率", f.revenueGrowth, (v) => `${(v * 100).toFixed(1)}%`],
    ["利益率", f.profitMargin, (v) => `${(v * 100).toFixed(1)}%`],
  ];
  return (
    <table className="mt-4 w-full text-sm">
      <tbody>
        {rows.map(([label, value, fmt]) => (
          <tr key={label} className="border-t dark:border-gray-700">
            <td className="py-1.5 text-gray-600 dark:text-gray-400">{label}</td>
            <td className="py-1.5 text-right font-mono">
              {value != null ? fmt(value) : "—"}
            </td>
          </tr>
        ))}
        <tr className="border-t dark:border-gray-700">
          <td className="py-1.5 text-gray-600 dark:text-gray-400">取得日時</td>
          <td className="py-1.5 text-right text-xs text-gray-500 dark:text-gray-400">
            {f.fetchedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
