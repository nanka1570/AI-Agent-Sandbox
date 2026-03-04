"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// ステータスの日本語変換マップ
const STATUS_LABELS: Record<string, string> = {
  unconfirmed: "未確定",
  confirmed: "確定",
  paid: "支払済",
};

/**
 * 月別の支払いデータをCSV文字列で返す
 * CSVフォーマット: 日付,カテゴリ,カード名,金額,ステータス,メモ
 */
export async function exportPaymentsCSV(
  month: string
): Promise<{ success: true; csv: string } | { success: false; error: string }> {
  const userId = await requireAuth();

  // 入力バリデーション
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { success: false, error: "月のフォーマットが不正です" };
  }

  const payments = await prisma.payment.findMany({
    where: { month, userId },
    include: { creditCard: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  // CSVヘッダー
  const header = "日付,カテゴリ,カード名,金額,ステータス,メモ";

  // CSV行を生成
  const rows = payments.map((payment) => {
    const date = payment.month;
    const category = payment.category?.name ?? "";
    const cardName = escapeCsvField(payment.creditCard.name);
    const amount = String(payment.amount);
    const status = STATUS_LABELS[payment.status] ?? payment.status;
    const memo = escapeCsvField(payment.memo ?? "");

    return `${date},${category},${cardName},${amount},${status},${memo}`;
  });

  const csv = [header, ...rows].join("\n");

  return { success: true, csv };
}

/**
 * CSVフィールドにカンマやダブルクォートが含まれる場合にエスケープする
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
