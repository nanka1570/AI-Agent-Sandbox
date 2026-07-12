// yahoo-finance2（非公式 API）への依存はこのファイルに隔離する
import YahooFinance from "yahoo-finance2";
import { mapChartQuotes, type PriceRow } from "./transform";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function fetchDailyPrices(
  ticker: string,
  period1: Date
): Promise<PriceRow[]> {
  const result = await yahooFinance.chart(ticker, {
    period1,
    interval: "1d",
    return: "array",
  });
  return mapChartQuotes(result.quotes);
}

// ── ファンダメンタルズ（現在値） ──

export interface EarningsSurprise {
  quarter: string; // "2026-03-31" など
  actual: number | null;
  estimate: number | null;
  surprisePct: number | null; // 0.05 = +5%
}

export interface FundamentalData {
  per: number | null;
  forwardPer: number | null;
  pbr: number | null;
  peg: number | null;
  roe: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  revenueGrowth: number | null;
  currentRatio: number | null;
  debtToEquity: number | null; // 1.0 = 1倍に正規化して返す
  operatingCashflow: number | null;
  freeCashflow: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  surprises: EarningsSurprise[]; // 直近4四半期（古い順）
}

// API の型定義が緩いフィールドがあるため、有限の数値のみ通す
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchFundamentals(
  ticker: string
): Promise<FundamentalData> {
  const r = await yahooFinance.quoteSummary(ticker, {
    modules: [
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "earningsHistory",
    ],
  });
  const de = num(r.financialData?.debtToEquity);
  const surprises: EarningsSurprise[] = (r.earningsHistory?.history ?? []).map(
    (h) => ({
      quarter:
        h.quarter instanceof Date ? h.quarter.toISOString().slice(0, 10) : "",
      actual: num(h.epsActual),
      estimate: num(h.epsEstimate),
      surprisePct: num(h.surprisePercent),
    })
  );
  return {
    per: num(r.summaryDetail?.trailingPE),
    forwardPer: num(r.summaryDetail?.forwardPE),
    pbr: num(r.defaultKeyStatistics?.priceToBook),
    peg: num(
      r.defaultKeyStatistics?.pegRatio ??
        r.defaultKeyStatistics?.trailingPegRatio
    ),
    roe: num(r.financialData?.returnOnEquity),
    operatingMargin: num(r.financialData?.operatingMargins),
    profitMargin: num(r.financialData?.profitMargins),
    revenueGrowth: num(r.financialData?.revenueGrowth),
    currentRatio: num(r.financialData?.currentRatio),
    debtToEquity: de != null ? de / 100 : null, // API は % 表記（83.7 = 0.84倍）
    operatingCashflow: num(r.financialData?.operatingCashflow),
    freeCashflow: num(r.financialData?.freeCashflow),
    dividendYield: num(r.summaryDetail?.dividendYield),
    payoutRatio: num(r.summaryDetail?.payoutRatio),
    surprises,
  };
}

// ── 年次推移（貸借対照表・キャッシュフロー計算書、直近 4〜5 年） ──

export type Trend = "up" | "flat" | "down";

export interface FundamentalTrends {
  equityRatio: number | null; // 最新年次の自己資本比率
  debtTrend: Trend | null; // 負債の推移（down = 減少傾向 = 良い）
  ocfTrend: Trend | null; // 営業CFの推移（up = 増加傾向 = 良い）
  fcfNegativeStreak: boolean | null; // 直近2年以上 FCF マイナス継続
  sharesTrend: Trend | null; // 発行済株式数（up = 希薄化 = 警戒）
}

// 系列の最初と最後を比較して傾向を返す（tolerance は変化率の許容幅）
function trendOf(series: number[], tolerance: number): Trend | null {
  if (series.length < 2 || series[0] === 0) return null;
  const change = series[series.length - 1] / series[0] - 1;
  if (change > tolerance) return "up";
  if (change < -tolerance) return "down";
  return "flat";
}

function pick(rows: Record<string, unknown>[], key: string): number[] {
  return rows
    .map((row) => num(row[key]))
    .filter((v): v is number => v != null);
}

export async function fetchFundamentalTrends(
  ticker: string
): Promise<FundamentalTrends> {
  const period1 = new Date();
  period1.setUTCFullYear(period1.getUTCFullYear() - 5);

  const [balance, cashflow] = await Promise.all([
    yahooFinance.fundamentalsTimeSeries(ticker, {
      period1,
      type: "annual",
      module: "balance-sheet",
    }) as Promise<Record<string, unknown>[]>,
    yahooFinance.fundamentalsTimeSeries(ticker, {
      period1,
      type: "annual",
      module: "cash-flow",
    }) as Promise<Record<string, unknown>[]>,
  ]);

  const assets = pick(balance, "totalAssets");
  const equity = pick(balance, "stockholdersEquity");
  const debt = pick(balance, "totalDebt");
  const shares = pick(balance, "shareIssued");
  const ocf = pick(cashflow, "operatingCashFlow");
  const fcf = pick(cashflow, "freeCashFlow");

  const lastAssets = assets[assets.length - 1];
  const lastEquity = equity[equity.length - 1];

  return {
    equityRatio:
      lastAssets != null && lastEquity != null && lastAssets > 0
        ? lastEquity / lastAssets
        : null,
    debtTrend: trendOf(debt, 0.05),
    ocfTrend: trendOf(ocf, 0.05),
    fcfNegativeStreak:
      fcf.length >= 2 ? fcf.slice(-2).every((v) => v < 0) : null,
    sharesTrend: trendOf(shares, 0.01), // 希薄化は 1% でも警戒対象
  };
}

// ── 市場全体（VIX） ──

export async function fetchVix(): Promise<number | null> {
  const q = await yahooFinance.quote("^VIX");
  return num(q?.regularMarketPrice);
}
