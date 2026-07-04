import { prisma } from "@/lib/prisma";
import type { Fundamental } from "@/generated/prisma/client";
import { fetchFundamentals } from "./yahoo";

const TTL_MS = 24 * 60 * 60 * 1000; // 24時間キャッシュ

// ファンダメンタルズの現在値を取得する（DB キャッシュ優先）
// API 取得に失敗した場合は期限切れでも手元のキャッシュを返す
export async function getFundamental(
  ticker: string
): Promise<Fundamental | null> {
  const cached = await prisma.fundamental.findUnique({ where: { ticker } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < TTL_MS) {
    return cached;
  }

  try {
    const data = await fetchFundamentals(ticker);
    return await prisma.fundamental.upsert({
      where: { ticker },
      update: { ...data, fetchedAt: new Date() },
      create: { ticker, ...data, fetchedAt: new Date() },
    });
  } catch {
    return cached;
  }
}
