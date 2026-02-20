// ダッシュボード集計ロジック（テスト可能にするために分離）

type SalaryLike = { amount: number };
type PaymentLike = { amount: number; status: string; creditCardId: string; creditCard: { name: string } };
type PaymentMonthLike = { amount: number; month: string };

// 給料合計
export function calcTotalSalary(salaries: SalaryLike[]): number {
  return salaries.reduce((sum, s) => sum + s.amount, 0);
}

// 支払い合計
export function calcTotalPayment(payments: PaymentLike[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

// ステータス別内訳
export function calcStatusBreakdown(payments: PaymentLike[]) {
  return {
    unconfirmed: payments
      .filter((p) => p.status === "unconfirmed")
      .reduce((sum, p) => sum + p.amount, 0),
    confirmed: payments
      .filter((p) => p.status === "confirmed")
      .reduce((sum, p) => sum + p.amount, 0),
    paid: payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
  };
}

// 残額
export function calcBalance(totalSalary: number, totalPayment: number): number {
  return totalSalary - totalPayment;
}

// 確定分残額
export function calcConfirmedBalance(
  totalSalary: number,
  confirmed: number,
  paid: number
): number {
  return totalSalary - (confirmed + paid);
}

// 月別集計（棒グラフ用）
export function calcMonthlyData(
  allPayments: PaymentMonthLike[],
  months: string[]
): { month: string; total: number }[] {
  return months.map((m) => ({
    month: m,
    total: allPayments
      .filter((p) => p.month === m)
      .reduce((sum, p) => sum + p.amount, 0),
  }));
}

// クレカ別集計（円グラフ用 - 旧互換）
export function calcCategoryData(
  payments: PaymentLike[]
): { name: string; total: number }[] {
  const cardTotals = new Map<string, { name: string; total: number }>();
  for (const p of payments) {
    const existing = cardTotals.get(p.creditCardId);
    if (existing) {
      existing.total += p.amount;
    } else {
      cardTotals.set(p.creditCardId, {
        name: p.creditCard.name,
        total: p.amount,
      });
    }
  }
  return Array.from(cardTotals.values());
}

// カテゴリ別集計（円グラフ用 - カテゴリベース）
type PaymentWithCategoryLike = {
  amount: number;
  categoryId: string | null;
  category: { name: string; color: string } | null;
};

export function calcCategoryBreakdown(
  payments: PaymentWithCategoryLike[]
): { name: string; total: number; color: string }[] {
  const categoryTotals = new Map<string, { name: string; total: number; color: string }>();
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
  return Array.from(categoryTotals.values());
}
