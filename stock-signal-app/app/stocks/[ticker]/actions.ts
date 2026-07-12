"use server";

import { revalidatePath } from "next/cache";
import { BENCHMARK, NASDAQ100 } from "@/lib/constants/nasdaq100";
import { prisma } from "@/lib/prisma";

const MAX_MEMO_LENGTH = 4000;

export interface SaveMemoResult {
  ok: boolean;
  error?: string;
}

// 国別売上・事業構成など、無料 API で取得できない情報の手動メモを保存する
// Server Action は公開エンドポイントのため、入力は必ず検証する
export async function saveMemo(
  ticker: string,
  memo: string
): Promise<SaveMemoResult> {
  const upper = ticker.toUpperCase();
  const known =
    upper === BENCHMARK.ticker || NASDAQ100.some((s) => s.ticker === upper);
  if (!known) {
    return { ok: false, error: `未知の銘柄です: ${ticker}` };
  }
  if (memo.length > MAX_MEMO_LENGTH) {
    return {
      ok: false,
      error: `メモは ${MAX_MEMO_LENGTH} 文字以内にしてください（現在 ${memo.length} 文字）`,
    };
  }

  try {
    await prisma.stock.update({
      where: { ticker: upper },
      data: { memo: memo.trim() === "" ? null : memo },
    });
  } catch {
    return { ok: false, error: "保存に失敗しました（データ未同期の銘柄の可能性）" };
  }
  revalidatePath(`/stocks/${upper}`);
  return { ok: true };
}
