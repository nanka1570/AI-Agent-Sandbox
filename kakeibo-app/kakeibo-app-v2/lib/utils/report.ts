import { prisma } from "@/lib/prisma";
import { UNCATEGORIZED_LABEL, UNCATEGORIZED_COLOR } from "@/lib/constants";

export interface ReportData {
  year: number;
  monthlyExpenses: Array<{
    month: string;
    total: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    color: string;
    total: number;
  }>;
  annualSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

/**
 * 指定年のレポートデータを集計して返す
 */
export async function getReportData(
  userId: string,
  year: number,
): Promise<ReportData> {
  // 12ヶ月分の月キーを生成
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return `${year}-${m}`;
  });

  // 支払いデータとカテゴリを取得
  const payments = await prisma.payment.findMany({
    where: {
      userId,
      month: { in: months },
    },
    include: {
      category: { select: { name: true, color: true } },
    },
  });

  // 月別支出の集計
  const monthlyMap = new Map<string, number>();
  months.forEach((m) => monthlyMap.set(m, 0));
  payments.forEach((p) => {
    monthlyMap.set(p.month, (monthlyMap.get(p.month) ?? 0) + p.amount);
  });
  const monthlyExpenses = months.map((m) => ({
    month: m,
    total: monthlyMap.get(m) ?? 0,
  }));

  // カテゴリ別集計
  const categoryMap = new Map<
    string,
    { name: string; color: string; total: number }
  >();
  payments.forEach((p) => {
    const name = p.category?.name ?? UNCATEGORIZED_LABEL;
    const color = p.category?.color ?? UNCATEGORIZED_COLOR;
    const key = name;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += p.amount;
    } else {
      categoryMap.set(key, { name, color, total: p.amount });
    }
  });
  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  // 年間給与合計
  const salaries = await prisma.salary.findMany({
    where: {
      userId,
      month: { in: months },
    },
  });
  const totalIncome = salaries.reduce((sum, s) => sum + s.amount, 0);
  const totalExpense = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    year,
    monthlyExpenses,
    categoryBreakdown,
    annualSummary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
  };
}
