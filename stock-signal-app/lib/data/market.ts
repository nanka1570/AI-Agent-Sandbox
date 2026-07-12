import { fetchVix } from "./yahoo";

// VIX（恐怖指数）: 30 以上 = 市場パニック（かつ長期目線では買い場になりうる）
export const VIX_PANIC_LEVEL = 30;

const TTL_MS = 60 * 60 * 1000; // 1時間キャッシュ（ダッシュボード表示ごとの API 呼び出しを防ぐ）

let cache: { value: number | null; fetchedAt: number } | null = null;

export async function getVix(): Promise<number | null> {
  // E2E など外部 API を呼びたくない環境ではスキップ（UI は非表示になる）
  if (process.env.DISABLE_VIX === "1") return null;
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.value;
  }
  try {
    const value = await fetchVix();
    cache = { value, fetchedAt: Date.now() };
    return value;
  } catch {
    return cache?.value ?? null;
  }
}
