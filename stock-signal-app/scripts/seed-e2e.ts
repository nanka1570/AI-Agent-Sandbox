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
// （後半のどこかで SMA50 が SMA200 を上抜け、ゴールデンクロスが発生する）
function syntheticPrice(i: number): number {
  if (i < 250) return 300 - (100 * i) / 249;
  return 200 + (200 * (i - 250)) / 149;
}

async function seedStock(
  ticker: string,
  name: string,
  sector: string,
  fundamental: {
    per: number | null;
    forwardPer: number | null;
    peg: number | null;
    revenueGrowth: number | null;
    profitMargin: number | null;
  }
) {
  await prisma.stock.upsert({
    where: { ticker },
    update: { name, sector },
    create: { ticker, name, sector },
  });
  await prisma.dailyPrice.deleteMany({ where: { ticker } });
  await prisma.dailyPrice.createMany({
    data: Array.from({ length: DAYS }, (_, i) => {
      const price = syntheticPrice(i);
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
  await prisma.fundamental.upsert({
    where: { ticker },
    update: { ...fundamental, fetchedAt: new Date() },
    create: { ticker, ...fundamental, fetchedAt: new Date() },
  });
}

async function main() {
  await seedStock("AAPL", "Apple", "情報技術", {
    per: 30,
    forwardPer: 25,
    peg: 1.8,
    revenueGrowth: 0.12,
    profitMargin: 0.25,
  });
  await seedStock("NVDA", "NVIDIA", "情報技術", {
    per: 55,
    forwardPer: 48,
    peg: null,
    revenueGrowth: 0.6,
    profitMargin: null,
  });
  console.log(`E2E シード完了: ${file} に 2 銘柄 × ${DAYS} 日分`);
}

main()
  .catch((error) => {
    console.error("E2E シードに失敗しました:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
