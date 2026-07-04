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

export interface FundamentalData {
  per: number | null;
  forwardPer: number | null;
  peg: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
}

// API の型定義が緩いフィールドがあるため、有限の数値のみ通す
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchFundamentals(
  ticker: string
): Promise<FundamentalData> {
  const r = await yahooFinance.quoteSummary(ticker, {
    modules: ["summaryDetail", "defaultKeyStatistics", "financialData"],
  });
  return {
    per: num(r.summaryDetail?.trailingPE),
    forwardPer: num(r.summaryDetail?.forwardPE),
    peg: num(
      r.defaultKeyStatistics?.pegRatio ??
        r.defaultKeyStatistics?.trailingPegRatio
    ),
    revenueGrowth: num(r.financialData?.revenueGrowth),
    profitMargin: num(r.financialData?.profitMargins),
  };
}
