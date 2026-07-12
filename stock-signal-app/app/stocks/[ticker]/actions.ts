"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// 国別売上・事業構成など、無料 API で取得できない情報の手動メモを保存する
export async function saveMemo(ticker: string, memo: string): Promise<void> {
  await prisma.stock.update({
    where: { ticker },
    data: { memo: memo.trim() === "" ? null : memo },
  });
  revalidatePath(`/stocks/${ticker}`);
}
