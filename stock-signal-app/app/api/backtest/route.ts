import { runBacktest } from "@/lib/backtest/run";
import { NASDAQ100 } from "@/lib/constants/nasdaq100";
import { prisma } from "@/lib/prisma";
import {
  evaluatePriceCross,
  evaluateRsi,
  evaluateSmaCross,
  MIN_SHORT_DATA_POINTS,
} from "@/lib/signals/evaluate";

const RULES = ["sma-cross", "price-cross", "rsi"] as const;
type Rule = (typeof RULES)[number];

interface BacktestRequest {
  ticker?: string;
  rule?: string;
  from?: string;
  to?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as BacktestRequest;
  const { ticker, rule, from, to } = body;

  if (!ticker || !rule || !from || !to) {
    return Response.json(
      { error: "ticker, rule, from, to は必須です" },
      { status: 400 }
    );
  }
  if (!RULES.includes(rule as Rule)) {
    return Response.json({ error: `不明なルールです: ${rule}` }, { status: 400 });
  }
  if (!NASDAQ100.some((s) => s.ticker === ticker.toUpperCase())) {
    return Response.json(
      { error: `NASDAQ-100 に含まれない銘柄です: ${ticker}` },
      { status: 400 }
    );
  }
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
    return Response.json({ error: "期間の指定が不正です" }, { status: 400 });
  }

  // ウォームアップのため全期間を読み、シグナル判定後に期間で絞る
  const prices = await prisma.dailyPrice.findMany({
    where: { ticker: ticker.toUpperCase() },
    orderBy: { date: "asc" },
    select: { date: true, adjClose: true },
  });

  if (prices.length < MIN_SHORT_DATA_POINTS) {
    return Response.json(
      { error: "価格データが不足しています。先にダッシュボードでデータ更新を実行してください" },
      { status: 422 }
    );
  }

  const signals =
    rule === "sma-cross"
      ? evaluateSmaCross(prices) // 5日線が25日線をクロス
      : rule === "price-cross"
        ? evaluatePriceCross(prices) // 価格が25日線をクロス
        : evaluateRsi(prices);

  try {
    const result = runBacktest(prices, signals, { from: fromDate, to: toDate });
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "バックテストに失敗しました";
    return Response.json({ error: message }, { status: 422 });
  }
}
