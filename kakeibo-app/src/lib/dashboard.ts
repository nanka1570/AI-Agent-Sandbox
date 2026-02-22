// ダッシュボード集計ロジック（テスト可能にするために分離）

type SalaryLike = { amount: number };
type PaymentLike = { amount: number; status: string; creditCardId: string; creditCard: { name: string } };
type PaymentMonthLike = { amount: number; month: string; paymentMonthOffset: number };

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

// 月別集計（棒グラフ用）: 引き落とし月ベースで集計
export function calcMonthlyData(
  allPayments: PaymentMonthLike[],
  months: string[]
): { month: string; total: number }[] {
  return months.map((m) => ({
    month: m,
    total: allPayments
      .filter((p) => {
        const [y, mo] = p.month.split("-").map(Number);
        const d = new Date(y, mo - 1 + p.paymentMonthOffset, 1);
        const actualMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return actualMonth === m;
      })
      .reduce((sum, p) => sum + p.amount, 0),
  }));
}

// 資金繰りステータス計算
type PaymentForCashFlow = {
  id: string;
  amount: number;
  month?: string; // 締め月（新サイクルシステムで使用。省略時は旧ロジック）
  creditCard: { name: string; paymentDay: number; paymentMonthOffset: number };
};

export type CashFlowItem = {
  id: string;
  cardName: string;
  paymentDay: number;
  paymentMonthOffset: number;
  closingMonth: string; // 締め月（支払日表示用）
  amount: number;
  isSafe: boolean; // true = 給料入金後, false = 給料入金前
};

/**
 * 給料支給日と各支払いの実際の支払日を比較して、資金繰りの安全性を返す
 * currentMonth 指定時（新ロジック）:
 *   - 実際の引き落とし月が currentMonth と一致 → 給料日と支払日を比較
 *   - 実際の引き落とし月が翌月以降 → 常に安全
 * currentMonth 省略時（旧ロジック・テスト後方互換）:
 *   - paymentMonthOffset > 0: 常に安全
 *   - paymentMonthOffset = 0: 給料日 <= 支払日 なら安全
 */
export function calcCashFlowStatus(
  salaryPayDay: number,
  payments: PaymentForCashFlow[],
  currentMonth?: string
): CashFlowItem[] {
  return payments
    .map((p) => {
      const { paymentDay, paymentMonthOffset, name } = p.creditCard;
      let isSafe: boolean;
      if (currentMonth && p.month) {
        // 実際の引き落とし月を計算し、当月か翌月以降かを判定
        const [py, pm] = p.month.split("-").map(Number);
        const actualDate = new Date(py, pm - 1 + paymentMonthOffset, 1);
        const actualMonthStr = `${actualDate.getFullYear()}-${String(actualDate.getMonth() + 1).padStart(2, "0")}`;
        if (actualMonthStr === currentMonth) {
          // 当月払い: 給料日と支払日を比較
          isSafe = salaryPayDay <= paymentDay;
        } else {
          // 翌月以降払い: 給料入金後なので常に安全
          isSafe = true;
        }
      } else {
        // 旧ロジック（テスト後方互換）
        isSafe = paymentMonthOffset > 0 || salaryPayDay <= paymentDay;
      }
      return {
        id: p.id,
        cardName: name,
        paymentDay,
        paymentMonthOffset,
        closingMonth: p.month ?? "",
        amount: p.amount,
        isSafe,
      };
    })
    .sort((a, b) => {
      if (a.paymentMonthOffset !== b.paymentMonthOffset) return a.paymentMonthOffset - b.paymentMonthOffset;
      return a.paymentDay - b.paymentDay;
    });
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
