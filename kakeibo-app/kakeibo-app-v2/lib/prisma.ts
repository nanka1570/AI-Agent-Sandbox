import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// 本番環境ではリクエストごとにキャッシュせず直接インスタンスを保持
// 開発環境では HMR によるインスタンス重複を防ぐため globalThis にキャッシュ
let prismaInstance: PrismaClient | undefined;

// Proxy による遅延初期化（ビルド時の PrismaClient 生成を回避）
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (process.env.NODE_ENV === "development") {
      // 開発環境: globalThis にキャッシュして HMR 時の重複を防止
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
      }
      const value = Reflect.get(globalForPrisma.prisma, prop);
      return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
    } else {
      // 本番環境: モジュールスコープのシングルトンを使用
      if (!prismaInstance) {
        prismaInstance = createPrismaClient();
      }
      const value = Reflect.get(prismaInstance, prop);
      return typeof value === "function" ? value.bind(prismaInstance) : value;
    }
  },
});
