import type { Fundamental, Stock } from "@/generated/prisma/client";
import { BENCHMARK } from "@/lib/constants/nasdaq100";
import { prisma } from "@/lib/prisma";
import {
  assessFundamentals,
  type FundamentalAssessment,
} from "@/lib/fundamentals/score";
import {
  evaluatePriceCross,
  evaluateRsi,
  evaluateSmaCross,
  MIN_DATA_POINTS,
  MIN_SHORT_DATA_POINTS,
  RECENT_TRADING_DAYS,
  recentSignal,
  type Signal,
} from "@/lib/signals/evaluate";
import {
  analyzeTechnicalState,
  type DailyBar,
  type TechnicalState,
} from "@/lib/signals/technical-state";

// ダッシュボードのシグナル・状態判定に読む日数（SMA200 + 高値圏判定の 250 日に足りる量）
const DASHBOARD_LOOKBACK = 320;

export interface SerializedSignal {
  date: string;
  type: Signal["type"];
  rule: Signal["rule"];
  reason: string;
}

// ダッシュボード 1 行分のデータ
export interface StockSummary {
  ticker: string;
  name: string;
  sector: string;
  latestAdjClose: number | null;
  latestDate: string | null;
  hasShortData: boolean; // 5/25 クロス判定が可能か
  hasLongData: boolean; // 200日線判定が可能か
  shortSignal: SerializedSignal | null; // 5/25 GC・価格×25日線の直近シグナル
  longTrend: "up" | "down" | null;
  perfectOrder: boolean | null;
  kairi25: number | null;
  kairiWarning: boolean;
  bbPosition: "upper" | "lower" | null;
  volumeSurgeBullish: boolean;
  volumeFadeAtHigh: boolean;
  lowVolumeRally: boolean;
  return20d: number | null;
  counterTrendUp: boolean | null;
  fundPassed: number | null;
  fundTotal: number | null;
  warningCount: number;
  stockType: string | null;
  // テクニカル買い × 業績赤字 = Intel 型の投機（矛盾警告）
  speculativeBuy: boolean;
}

function serialize(signal: Signal | null): SerializedSignal | null {
  if (!signal) return null;
  return {
    date: signal.date.toISOString().slice(0, 10),
    type: signal.type,
    rule: signal.rule,
    reason: signal.reason,
  };
}

async function getBenchmarkPrices(): Promise<
  { date: Date; adjClose: number }[]
> {
  const rows = await prisma.dailyPrice.findMany({
    where: { ticker: BENCHMARK.ticker },
    orderBy: { date: "desc" },
    take: DASHBOARD_LOOKBACK,
    select: { date: true, adjClose: true },
  });
  return rows.reverse();
}

export async function getStockSummaries(): Promise<StockSummary[]> {
  const stocks = await prisma.stock.findMany({
    where: { ticker: { not: BENCHMARK.ticker } },
    include: { fundamental: true },
    orderBy: { ticker: "asc" },
  });
  const benchmark = await getBenchmarkPrices();

  const summaries: StockSummary[] = [];
  for (const stock of stocks) {
    const rows = await prisma.dailyPrice.findMany({
      where: { ticker: stock.ticker },
      orderBy: { date: "desc" },
      take: DASHBOARD_LOOKBACK,
      select: {
        date: true,
        adjClose: true,
        open: true,
        close: true,
        volume: true,
      },
    });
    rows.reverse();
    summaries.push(buildSummary(stock, rows, benchmark));
  }
  return summaries;
}

function buildSummary(
  stock: Stock & { fundamental: Fundamental | null },
  bars: DailyBar[],
  benchmark: { date: Date; adjClose: number }[]
): StockSummary {
  const hasShortData = bars.length >= MIN_SHORT_DATA_POINTS;
  const hasLongData = bars.length >= MIN_DATA_POINTS;
  const latest = bars[bars.length - 1] ?? null;
  const cutoff =
    bars.length >= RECENT_TRADING_DAYS
      ? bars[bars.length - RECENT_TRADING_DAYS].date
      : new Date(0);

  // 短期シグナル: 5/25 GC と価格×25日線の両ルールから直近を採用
  let shortSignal: Signal | null = null;
  if (hasShortData) {
    const merged = [...evaluateSmaCross(bars), ...evaluatePriceCross(bars)].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    shortSignal = recentSignal(merged, cutoff);
  }

  const state: TechnicalState | null =
    bars.length > 0 ? analyzeTechnicalState(bars, benchmark) : null;

  const assessment = stock.fundamental
    ? assessFundamentals(stock.fundamental)
    : null;

  return {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    latestAdjClose: latest?.adjClose ?? null,
    latestDate: latest?.date.toISOString().slice(0, 10) ?? null,
    hasShortData,
    hasLongData,
    shortSignal: serialize(shortSignal),
    longTrend: hasLongData ? (state?.longTrend ?? null) : null,
    perfectOrder: hasLongData ? (state?.perfectOrder ?? null) : null,
    kairi25: state?.kairi25 ?? null,
    kairiWarning: state?.kairiWarning ?? false,
    bbPosition: state?.bbPosition ?? null,
    volumeSurgeBullish: state?.volumeSurgeBullish ?? false,
    volumeFadeAtHigh: state?.volumeFadeAtHigh ?? false,
    lowVolumeRally: state?.lowVolumeRally ?? false,
    return20d: state?.return20d ?? null,
    counterTrendUp: state?.counterTrendUp ?? null,
    fundPassed: assessment?.passed ?? null,
    fundTotal: assessment?.total ?? null,
    warningCount: assessment?.warnings.length ?? 0,
    stockType: assessment?.stockType ?? null,
    speculativeBuy:
      shortSignal?.type === "buy" && (assessment?.isLossMaking ?? false),
  };
}

// 銘柄詳細ページ用: 全期間の価格とシグナル・テクニカル状態・ファンダ評価
export interface StockDetail {
  stock: Stock & { fundamental: Fundamental | null };
  bars: DailyBar[];
  smaSignals: Signal[]; // 5/25 GC
  priceSignals: Signal[]; // 価格×25日線
  rsiSignals: Signal[];
  technicalState: TechnicalState | null;
  assessment: FundamentalAssessment | null;
}

export async function getStockDetail(
  ticker: string
): Promise<StockDetail | null> {
  const stock = await prisma.stock.findUnique({
    where: { ticker },
    include: { fundamental: true },
  });
  if (!stock) return null;

  const bars = await prisma.dailyPrice.findMany({
    where: { ticker },
    orderBy: { date: "asc" },
    select: {
      date: true,
      adjClose: true,
      open: true,
      close: true,
      volume: true,
    },
  });
  const benchmark = await getBenchmarkPrices();

  return {
    stock,
    bars,
    smaSignals: bars.length >= MIN_SHORT_DATA_POINTS ? evaluateSmaCross(bars) : [],
    priceSignals:
      bars.length >= MIN_SHORT_DATA_POINTS ? evaluatePriceCross(bars) : [],
    rsiSignals: bars.length > 15 ? evaluateRsi(bars) : [],
    technicalState:
      bars.length > 0 ? analyzeTechnicalState(bars, benchmark) : null,
    assessment: stock.fundamental
      ? assessFundamentals(stock.fundamental)
      : null,
  };
}
