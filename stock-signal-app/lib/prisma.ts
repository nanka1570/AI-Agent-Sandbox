import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // DATABASE_FILE はプロジェクトルートからの相対パス（E2E がテスト用 DB に切り替えるために使う）
  const file = process.env.DATABASE_FILE ?? path.join("prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({
    url: "file:" + path.join(process.cwd(), file),
  });
  return new PrismaClient({ adapter });
}

// 開発環境: HMR によるインスタンス重複を防ぐため globalThis にキャッシュ
// 本番環境: モジュールスコープのシングルトンで十分
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
