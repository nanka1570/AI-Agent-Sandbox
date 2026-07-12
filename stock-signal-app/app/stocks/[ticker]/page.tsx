import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, SignalTypeBadge } from "@/components/badge";
import { MemoForm } from "@/components/memo-form";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { bollinger } from "@/lib/indicators/bollinger";
import { rsi } from "@/lib/indicators/rsi";
import { sma } from "@/lib/indicators/sma";
import { parseSurprises } from "@/lib/fundamentals/score";
import {
  RECENT_TRADING_DAYS,
  SMA_LONG_PERIOD,
  SMA_MID_PERIOD,
  SMA_SHORT_PERIOD,
  recentSignal,
  type Signal,
} from "@/lib/signals/evaluate";
import { KAIRI_WARN_PCT } from "@/lib/signals/technical-state";
import { getStockDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({
  params,
}: PageProps<"/stocks/[ticker]">) {
  const { ticker } = await params;
  const detail = await getStockDetail(ticker.toUpperCase());
  if (!detail) notFound();

  const {
    stock,
    bars,
    smaSignals,
    priceSignals,
    rsiSignals,
    technicalState: st,
    assessment,
  } = detail;

  const values = bars.map((b) => b.adjClose);
  const sma5 = sma(values, SMA_SHORT_PERIOD);
  const sma25 = sma(values, SMA_MID_PERIOD);
  const sma200 = sma(values, SMA_LONG_PERIOD);
  const bb = bollinger(values, SMA_MID_PERIOD, 2);
  const rsi14 = rsi(values, 14);

  const chartData: ChartPoint[] = bars.map((b, i) => ({
    date: b.date.toISOString().slice(0, 10),
    adjClose: round2(b.adjClose),
    sma5: opt(sma5[i]),
    sma25: opt(sma25[i]),
    sma200: opt(sma200[i]),
    bbUpper: opt(bb[i].upper),
    bbLower: opt(bb[i].lower),
    rsi: opt(rsi14[i]),
    volume: b.volume,
  }));

  const allSignals = [...smaSignals, ...priceSignals, ...rsiSignals].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const recentSignals = [...allSignals].reverse().slice(0, 10);
  const cutoff =
    bars.length >= RECENT_TRADING_DAYS
      ? bars[bars.length - RECENT_TRADING_DAYS].date
      : new Date(0);
  const current = recentSignal(
    allSignals.filter((s) => s.rule !== "rsi"),
    cutoff
  );
  const speculativeBuy =
    current?.type === "buy" && (assessment?.isLossMaking ?? false);

  const surprises = parseSurprises(stock.fundamental?.surprises ?? null);

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
          {assessment?.stockType && (
            <span
              className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              title={assessment.typeReason ?? undefined}
            >
              {assessment.stockType}
            </span>
          )}
        </h1>
      </div>

      {speculativeBuy && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          ⚠ テクニカルは買いだが業績は赤字（チャート買い × 業績赤字 = Intel
          型）。これは投機であると自覚して判断すること。
        </div>
      )}

      {bars.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          価格データがありません。ダッシュボードの「データ更新」を実行してください。
        </div>
      ) : (
        <>
          <TechnicalPanel st={st} />
          <PriceChart data={chartData} />
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-bold">
            直近のシグナル（新しい順・最大10件）
          </h2>
          {recentSignals.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              シグナル履歴はありません。
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <SignalLabel signal={s} />
                  <span className="text-gray-500 dark:text-gray-400">
                    {s.date.toISOString().slice(0, 10)}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {s.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-6 text-sm font-bold">
            決算サプライズ（EPS 予想 vs 実績）
          </h2>
          {surprises.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              データがありません。
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="py-1">四半期</th>
                  <th className="py-1 text-right">予想</th>
                  <th className="py-1 text-right">実績</th>
                  <th className="py-1 text-right">サプライズ</th>
                </tr>
              </thead>
              <tbody>
                {surprises.map((s) => (
                  <tr key={s.quarter} className="border-t dark:border-gray-700">
                    <td className="py-1.5">{s.quarter}</td>
                    <td className="py-1.5 text-right font-mono">
                      {s.estimate != null ? s.estimate.toFixed(2) : "—"}
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      {s.actual != null ? s.actual.toFixed(2) : "—"}
                    </td>
                    <td
                      className={`py-1.5 text-right font-mono ${
                        s.surprisePct == null
                          ? ""
                          : s.surprisePct >= 0
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {s.surprisePct != null
                        ? `${s.surprisePct >= 0 ? "+" : ""}${(s.surprisePct * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            プラスのサプライズが継続 = ガイダンスの信頼性が高い。大幅超過の継続 =
            業績が予想を置き去りにする急成長（サンディスク型）
          </p>
        </section>

        <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-bold">
            ファンダメンタルズ判定{" "}
            {assessment ? `${assessment.passed}/${assessment.total}` : "（未取得）"}
          </h2>
          {!assessment ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              「データ更新」を実行すると取得されます。
            </p>
          ) : (
            <div className="space-y-4">
              {assessment.warnings.length > 0 && (
                <ul className="space-y-1 rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                  {assessment.warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              )}
              {assessment.categories.map((cat) => (
                <div key={cat.name}>
                  <h3 className="mb-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                    {cat.name}（{cat.passed}/{cat.available}）
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {cat.items.map((item) => (
                      <li key={item.label} className="flex items-center gap-2">
                        <span className="w-4 shrink-0 text-center">
                          {item.passed == null ? "—" : item.passed ? "○" : "×"}
                        </span>
                        <span
                          className={
                            item.passed == null
                              ? "text-gray-400 dark:text-gray-500"
                              : ""
                          }
                        >
                          {item.label}
                        </span>
                        <span className="ml-auto font-mono text-xs text-gray-500 dark:text-gray-400">
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-sm font-bold">
          手動メモ（国別売上・事業構成・幹部の売買など）
        </h2>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          国別売上（中国比率）や事業構成（装置販売 vs 保守サービス）は無料 API
          では取得できないため、10-K・決算資料で確認した内容をここに記録する。
        </p>
        <MemoForm ticker={stock.ticker} initialMemo={stock.memo ?? ""} />
      </section>
    </div>
  );
}

function TechnicalPanel({
  st,
}: {
  st: NonNullable<Awaited<ReturnType<typeof getStockDetail>>>["technicalState"];
}) {
  if (!st) return null;
  const ma = (label: string, above: boolean | null) => (
    <Badge
      key={label}
      tone={above == null ? "gray" : above ? "green" : "red"}
      title={above == null ? "データ不足" : above ? `価格が${label}の上` : `価格が${label}の下`}
    >
      {label}
      {above == null ? "—" : above ? "↑" : "↓"}
    </Badge>
  );

  return (
    <section className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-bold">テクニカル状態</h2>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            価格 vs MA:
          </span>
          {ma("5日", st.aboveSma.sma5)}
          {ma("25日", st.aboveSma.sma25)}
          {ma("75日", st.aboveSma.sma75)}
          {ma("200日", st.aboveSma.sma200)}
        </span>
        <span>
          <span className="text-xs text-gray-500 dark:text-gray-400">長期: </span>
          {st.longTrend == null ? (
            "—"
          ) : st.longTrend === "up" ? (
            <span className="text-green-700 dark:text-green-400">
              上昇トレンド（200日線の上）
            </span>
          ) : (
            <span className="text-red-700 dark:text-red-400">
              下落トレンド（200日線の下）
            </span>
          )}
        </span>
        {st.perfectOrder && (
          <Badge tone="green">パーフェクトオーダー（強いトレンド継続）</Badge>
        )}
        <span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            25日線乖離:{" "}
          </span>
          <span
            className={`font-mono ${st.kairiWarning ? "font-bold text-orange-600 dark:text-orange-400" : ""}`}
          >
            {st.kairi25 != null
              ? `${st.kairi25 >= 0 ? "+" : ""}${st.kairi25.toFixed(1)}%`
              : "—"}
          </span>
          {st.kairiWarning && (
            <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">
              （+{KAIRI_WARN_PCT}% 超 = 天井警戒）
            </span>
          )}
        </span>
        {st.bbPosition === "upper" && (
          <Badge
            tone="orange"
            title="買われすぎ警戒。ただし上限張り付きの上昇は強さの証明でもある（両面で見る）"
          >
            BB +2σ タッチ
          </Badge>
        )}
        {st.bbPosition === "lower" && (
          <Badge tone="green">BB -2σ タッチ（買い検討）</Badge>
        )}
        {st.volumeSurgeBullish && <Badge tone="green">出来高急増 + 大陽線</Badge>}
        {st.volumeFadeAtHigh && (
          <Badge tone="orange">高値圏で出来高減少（利確検討）</Badge>
        )}
        {st.lowVolumeRally && (
          <Badge tone="orange">出来高を伴わない上昇（信頼しない）</Badge>
        )}
        {st.counterTrendUp && (
          <Badge tone="green">逆行高（地合いが悪い日に上昇 = 相対的に強い）</Badge>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        短期（5日/25日線）と長期（200日線）で判断が逆になることがある。どの時間軸で投資するか先に決めること。
      </p>
    </section>
  );
}

function SignalLabel({ signal }: { signal: Signal }) {
  return (
    <span className="shrink-0">
      <SignalTypeBadge type={signal.type} />
    </span>
  );
}

function opt(v: number | null): number | null {
  return v != null ? round2(v) : null;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
