"use server";

import { revalidatePath } from "next/cache";
import { generateMemoDraftFromFiling, isAiConfigured } from "@/lib/ai/extract";
import { ALL_STOCKS, BENCHMARK } from "@/lib/constants/nasdaq100";
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
    upper === BENCHMARK.ticker || ALL_STOCKS.some((s) => s.ticker === upper);
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

export interface GenerateDraftResult {
  ok: boolean;
  draft?: string;
  error?: string;
}

// SEC EDGAR の年次報告書から AI（Claude）で国別売上・事業構成を抽出し、
// メモ欄の下書きを生成する。API キー未設定時はエラーメッセージを返す
export async function generateMemoDraft(
  ticker: string
): Promise<GenerateDraftResult> {
  const upper = ticker.toUpperCase();
  if (!ALL_STOCKS.some((s) => s.ticker === upper)) {
    return { ok: false, error: `未知の銘柄です: ${ticker}` };
  }
  if (!isAiConfigured()) {
    return {
      ok: false,
      error:
        "AI 下書きは未設定です。.env.local に ANTHROPIC_API_KEY を設定してください",
    };
  }
  try {
    const result = await generateMemoDraftFromFiling(upper);
    return { ok: true, draft: result.draft };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "下書きの生成に失敗しました",
    };
  }
}
