"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { generatePaymentCSV } from "@/lib/utils/csv";
import type { ActionResult } from "@/lib/types";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

/**
 * 支払いデータをCSV文字列として生成するServer Action
 * monthを指定すると特定月のデータのみ、省略すると全データを出力
 */
export async function exportPaymentsCSV(
  month?: string
): Promise<ActionResult<string>> {
  if (month && !MONTH_PARAM_REGEX.test(month)) {
    return { success: false, error: "月の形式が正しくありません" };
  }
  try {
    const userId = await getAuthUserId();

    const payments = await prisma.payment.findMany({
      where: {
        userId,
        ...(month ? { month } : {}),
      },
      include: {
        creditCard: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ month: "desc" }, { sortOrder: "asc" }],
    });

    const csv = generatePaymentCSV(payments);
    return { success: true, data: csv };
  } catch {
    return { success: false, error: "CSVの生成に失敗しました" };
  }
}
