import { subYears } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ALL_STOCKS, BENCHMARK } from "@/lib/constants/nasdaq100";
import { fetchDailyPrices } from "./yahoo";

export interface SyncResult {
  ticker: string;
  added: number;
}

// 1 銘柄分の日足を差分同期する（初回は過去5年分）
// 既存最新日は途中値の可能性があるため、その日を含めて取り直す。何度実行しても安全
export async function syncStock(ticker: string): Promise<SyncResult> {
  const info =
    ticker === BENCHMARK.ticker
      ? BENCHMARK
      : ALL_STOCKS.find((s) => s.ticker === ticker);
  if (!info) {
    throw new Error(`分析対象に含まれない銘柄です: ${ticker}`);
  }

  await prisma.stock.upsert({
    where: { ticker },
    update: { name: info.name, sector: info.sector },
    create: { ticker, name: info.name, sector: info.sector },
  });

  const latest = await prisma.dailyPrice.findFirst({
    where: { ticker },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  // DB の最終日は「取引時間中の途中値」を保存している可能性があるため、
  // その日を含めて取り直す（削除→再挿入で確定値に更新。冪等）
  const period1 = latest ? latest.date : subYears(new Date(), 5);
  const rows = await fetchDailyPrices(ticker, period1);
  const fresh = latest ? rows.filter((r) => r.date >= latest.date) : rows;

  if (fresh.length > 0) {
    await prisma.$transaction([
      prisma.dailyPrice.deleteMany({
        where: { ticker, date: { gte: fresh[0].date } },
      }),
      prisma.dailyPrice.createMany({
        data: fresh.map((r) => ({ ticker, ...r })),
      }),
    ]);
  }

  return { ticker, added: fresh.length };
}
