import { prisma } from "@/lib/prisma";
import type { Fundamental } from "@/generated/prisma/client";
import { fetchFundamentals, fetchFundamentalTrends } from "./yahoo";

const TTL_MS = 24 * 60 * 60 * 1000; // 24時間キャッシュ

// ファンダメンタルズ（現在値 + 年次推移フラグ）を取得する（DB キャッシュ優先）
// API 取得に失敗した場合は期限切れでも手元のキャッシュを返す
export async function getFundamental(
  ticker: string
): Promise<Fundamental | null> {
  const cached = await prisma.fundamental.findUnique({ where: { ticker } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < TTL_MS) {
    return cached;
  }

  try {
    const current = await fetchFundamentals(ticker);

    // 年次推移は取れない銘柄もある（上場が浅い等）ため、失敗しても現在値だけで保存する
    let trends = {
      equityRatio: null as number | null,
      debtTrend: null as string | null,
      ocfTrend: null as string | null,
      fcfNegativeStreak: null as boolean | null,
      sharesTrend: null as string | null,
    };
    try {
      trends = { ...(await fetchFundamentalTrends(ticker)) };
    } catch {
      // 現在値のみで続行
    }

    const { surprises, ...rest } = current;
    const data = {
      ...rest,
      ...trends,
      surprises: JSON.stringify(surprises),
      fetchedAt: new Date(),
    };
    return await prisma.fundamental.upsert({
      where: { ticker },
      update: data,
      create: { ticker, ...data },
    });
  } catch {
    return cached;
  }
}
