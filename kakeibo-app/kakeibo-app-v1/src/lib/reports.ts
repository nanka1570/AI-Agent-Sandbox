// レポート集計ロジック（テスト可能にするために分離）

type SalaryLike = { amount: number; month: string };
type PaymentLike = {
  amount: number;
  month: string;
  categoryId: string | null;
  category: { name: string; color: string } | null;
};

// 年間サマリー: 収入合計 / 支出合計 / 収支
export function calcYearlySummary(
  salaries: SalaryLike[],
  payments: PaymentLike[]
) {
  const totalIncome = salaries.reduce((sum, s) => sum + s.amount, 0);
  const totalExpense = payments.reduce((sum, p) => sum + p.amount, 0);
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

// 月別内訳（前月比含む）
export function calcMonthlyBreakdown(
  salaries: SalaryLike[],
  payments: PaymentLike[],
  months: string[]
) {
  return months.map((month, index) => {
    const income = salaries
      .filter((s) => s.month === month)
      .reduce((sum, s) => sum + s.amount, 0);
    const expense = payments
      .filter((p) => p.month === month)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = income - expense;

    // 前月比を計算
    let prevExpense = 0;
    if (index > 0) {
      const prevMonth = months[index - 1];
      prevExpense = payments
        .filter((p) => p.month === prevMonth)
        .reduce((sum, p) => sum + p.amount, 0);
    }

    // 前月比の差分（前月の支出がない場合はnull）
    const expenseDiff = index > 0 ? expense - prevExpense : null;

    return {
      month,
      income,
      expense,
      balance,
      expenseDiff,
    };
  });
}

// カテゴリ別年間ランキング（金額降順）
export function calcCategoryRanking(payments: PaymentLike[]) {
  const totalExpense = payments.reduce((sum, p) => sum + p.amount, 0);

  // カテゴリごとに集計
  const categoryTotals = new Map<
    string,
    { name: string; total: number; color: string }
  >();

  for (const p of payments) {
    const key = p.categoryId ?? "__uncategorized__";
    const name = p.category?.name ?? "未分類";
    const color = p.category?.color ?? "#999999";
    const existing = categoryTotals.get(key);
    if (existing) {
      existing.total += p.amount;
    } else {
      categoryTotals.set(key, { name, total: p.amount, color });
    }
  }

  // 金額降順ソート + 割合を計算
  return Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .map((item, index) => ({
      rank: index + 1,
      name: item.name,
      color: item.color,
      total: item.total,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
    }));
}
