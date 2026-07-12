import { getFundamental } from "@/lib/data/fundamentals";
import { syncStock } from "@/lib/data/sync";

// 1 リクエスト = 1 銘柄の差分同期（クライアントが銘柄リストを直列に呼ぶ）
// 日足に加えてファンダメンタルズも更新する（24時間キャッシュ）
export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/sync/[ticker]">
) {
  const { ticker } = await ctx.params;
  try {
    const upper = ticker.toUpperCase();
    const result = await syncStock(upper);
    if (upper !== "QQQ") {
      await getFundamental(upper); // ベンチマークはファンダ不要
    }
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "同期に失敗しました";
    return Response.json({ ticker, error: message }, { status: 500 });
  }
}
