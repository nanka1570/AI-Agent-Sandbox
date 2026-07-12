// E2E テスト用の人工データ投入スクリプト
// 実 API に依存せずテストできるよう、ゴールデンクロスが発生する価格系列を生成する
// 実行: DATABASE_FILE=prisma/test.db npx tsx scripts/seed-e2e.ts
// 注意: tsx はパスエイリアスを解決しないため、このファイルは相対 import のみ使う

import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const file = process.env.DATABASE_FILE ?? path.join("prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.join(process.cwd(), file),
});
const prisma = new PrismaClient({ adapter });

const DAYS = 400;

function utcDay(offsetFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetFromToday
    )
  );
}

// 前半 250 日は 300 → 200 へ下降、後半 150 日は 200 → 400 へ上昇
// （後半のどこかで 5 日線が 25 日線を上抜け、ゴールデンクロスが発生する）
function syntheticPrice(i: number): number {
  if (i < 250) return 300 - (100 * i) / 249;
  return 200 + (200 * (i - 250)) / 149;
}

type FundamentalSeed = {
  per: number | null;
  forwardPer: number | null;
  pbr: number | null;
  peg: number | null;
  roe: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  revenueGrowth: number | null;
  currentRatio: number | null;
  equityRatio: number | null;
  debtToEquity: number | null;
  debtTrend: string | null;
  operatingCashflow: number | null;
  freeCashflow: number | null;
  ocfTrend: string | null;
  fcfNegativeStreak: boolean | null;
  sharesTrend: string | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  surprises: string | null;
};

async function seedStock(
  ticker: string,
  name: string,
  sector: string,
  fundamental: FundamentalSeed | null,
  priceOf: (i: number) => number = syntheticPrice
) {
  await prisma.stock.upsert({
    where: { ticker },
    update: { name, sector },
    create: { ticker, name, sector },
  });
  await prisma.dailyPrice.deleteMany({ where: { ticker } });
  await prisma.dailyPrice.createMany({
    data: Array.from({ length: DAYS }, (_, i) => {
      const price = priceOf(i);
      return {
        ticker,
        date: utcDay(i - DAYS + 1),
        open: price,
        high: price * 1.01,
        low: price * 0.99,
        close: price,
        adjClose: price,
        volume: 1_000_000,
      };
    }),
  });
  if (fundamental) {
    await prisma.fundamental.upsert({
      where: { ticker },
      update: { ...fundamental, fetchedAt: new Date() },
      create: { ticker, ...fundamental, fetchedAt: new Date() },
    });
  }
}

const surprisesJson = (pcts: number[]) =>
  JSON.stringify(
    pcts.map((p, i) => ({
      quarter: `2026-0${i + 1}-01`,
      actual: 1 + p,
      estimate: 1,
      surprisePct: p,
    }))
  );

async function main() {
  // AAPL: 高収益・高マージン → 「実績先行の王者型」に分類される
  await seedStock("AAPL", "Apple", "情報技術", {
    per: 30,
    forwardPer: 25,
    pbr: 40,
    peg: 1.8,
    roe: 0.35,
    operatingMargin: 0.32,
    profitMargin: 0.25,
    revenueGrowth: 0.12,
    currentRatio: 1.0,
    equityRatio: 0.2,
    debtToEquity: 1.5,
    debtTrend: "down",
    operatingCashflow: 100e9,
    freeCashflow: 90e9,
    ocfTrend: "up",
    fcfNegativeStreak: false,
    sharesTrend: "down",
    dividendYield: 0.005,
    payoutRatio: 0.15,
    surprises: surprisesJson([0.02, 0.01, 0.03, 0.02]),
  });

  // NVDA: サプライズ大幅超過の継続 → 「V字回復型」に分類される
  await seedStock("NVDA", "NVIDIA", "情報技術", {
    per: 55,
    forwardPer: 48,
    pbr: 30,
    peg: null,
    roe: 0.9,
    operatingMargin: 0.6,
    profitMargin: 0.5,
    revenueGrowth: 0.6,
    currentRatio: 4.0,
    equityRatio: 0.7,
    debtToEquity: 0.2,
    debtTrend: "down",
    operatingCashflow: 60e9,
    freeCashflow: 50e9,
    ocfTrend: "up",
    fcfNegativeStreak: false,
    sharesTrend: "flat",
    dividendYield: 0,
    payoutRatio: null,
    surprises: surprisesJson([0.1, 0.08, 0.12, 0.09]),
  });

  // QQQ: 逆行高判定用ベンチマーク（最終日だけ下落させ、個別銘柄の逆行高を発生させる）
  await seedStock(
    "QQQ",
    "Invesco QQQ（ベンチマーク）",
    "ベンチマーク",
    null,
    (i) => (i === DAYS - 1 ? syntheticPrice(i) * 0.97 : syntheticPrice(i))
  );

  console.log(`E2E シード完了: ${file} に 3 銘柄 × ${DAYS} 日分`);
}

main()
  .catch((error) => {
    console.error("E2E シードに失敗しました:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
