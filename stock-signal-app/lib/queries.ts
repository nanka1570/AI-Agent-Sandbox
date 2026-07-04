import type { Fundamental, Stock } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  evaluateRsi,
  evaluateSmaCross,
  MIN_DATA_POINTS,
  recentSignal,
  type PricePoint,
  type Signal,
} from "@/lib/signals/evaluate";
import {
  scoreFundamentals,
  type FundamentalScore,
} from "@/lib/fundamentals/score";

// ダッシュボード 1 行分のデータ
export interface StockSummary {
  ticker: string;
  name: string;
  sector: string;
  latestAdjClose: number | null;
  latestDate: string | null; // "YYYY-MM-DD"（Client Component へ渡すため文字列化）
  hasEnoughData: boolean; // SMA200 判定に必要な日数があるか
  smaSignal: SerializedSignal | null;
  rsiSignal: SerializedSignal | null;
  score: number | null; // ファンダ未取得なら null
}

export interface SerializedSignal {
  date: string;
  type: Signal["type"];
  reason: string;
}

// 「現在シグナル」= 直近 5 営業日以内に発生したシグナル
const RECENT_TRADING_DAYS = 5;

function serialize(signal: Signal | null): SerializedSignal | null {
  if (!signal) return null;
  return {
    date: signal.date.toISOString().slice(0, 10),
    type: signal.type,
    reason: signal.reason,
  };
}

export async function getStockSummaries(): Promise<StockSummary[]> {
  const stocks = await prisma.stock.findMany({
    include: { fundamental: true },
    orderBy: { ticker: "asc" },
  });

  const summaries: StockSummary[] = [];
  for (const stock of stocks) {
    // シグナル判定には直近 300 営業日で十分（全期間の読み込みを避ける）
    const rows = await prisma.dailyPrice.findMany({
      where: { ticker: stock.ticker },
      orderBy: { date: "desc" },
      take: 300,
      select: { date: true, adjClose: true },
    });
    rows.reverse(); // 昇順に戻す

    const hasEnoughData = rows.length >= MIN_DATA_POINTS;
    const latest = rows[rows.length - 1] ?? null;
    const cutoff =
      rows.length >= RECENT_TRADING_DAYS
        ? rows[rows.length - RECENT_TRADING_DAYS].date
        : new Date(0);

    summaries.push({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      latestAdjClose: latest?.adjClose ?? null,
      latestDate: latest?.date.toISOString().slice(0, 10) ?? null,
      hasEnoughData,
      smaSignal: hasEnoughData
        ? serialize(recentSignal(evaluateSmaCross(rows), cutoff))
        : null,
      rsiSignal:
        rows.length > 15
          ? serialize(recentSignal(evaluateRsi(rows), cutoff))
          : null,
      score: stock.fundamental
        ? scoreFundamentals(stock.fundamental).score
        : null,
    });
  }
  return summaries;
}

// 銘柄詳細ページ用: 全期間の価格とシグナル・スコア内訳
export interface StockDetail {
  stock: Stock & { fundamental: Fundamental | null };
  prices: PricePoint[];
  smaSignals: Signal[];
  rsiSignals: Signal[];
  fundamentalScore: FundamentalScore | null;
}

export async function getStockDetail(
  ticker: string
): Promise<StockDetail | null> {
  const stock = await prisma.stock.findUnique({
    where: { ticker },
    include: { fundamental: true },
  });
  if (!stock) return null;

  const rows = await prisma.dailyPrice.findMany({
    where: { ticker },
    orderBy: { date: "asc" },
    select: { date: true, adjClose: true },
  });

  return {
    stock,
    prices: rows,
    smaSignals: rows.length >= MIN_DATA_POINTS ? evaluateSmaCross(rows) : [],
    rsiSignals: rows.length > 15 ? evaluateRsi(rows) : [],
    fundamentalScore: stock.fundamental
      ? scoreFundamentals(stock.fundamental)
      : null,
  };
}
