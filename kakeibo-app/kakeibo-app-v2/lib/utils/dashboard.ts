import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calculateSalaryCycle, isDateInCycle } from "@/lib/utils/salary-cycle";
import { calculatePaymentDate } from "@/lib/utils/payment-date";
import { addMonthsToMonth } from "@/lib/utils/date";
import type { SalaryCycle } from "@/lib/utils/salary-cycle";
import type { PaymentStatus } from "@/lib/constants";

/** カードごとの支払い情報 */
interface CardPaymentGroup {
  card: {
    id: string;
    name: string;
    brand: string | null;
    sortOrder: number;
    paymentDay: number;
    paymentMonthOffset: number;
  };
  payments: Array<{
    id: string;
    month: string;
    amount: number;
    status: string;
    memo: string | null;
    category: { name: string; color: string } | null;
    sortOrder: number;
  }>;
  subtotal: number;
}

/** 資金繰りエントリ */
interface FundFlowEntry {
  date: Date;
  type: "salary" | "payment";
  label: string;
  amount: number;
  isBeforePayDay: boolean;
  sortOrder: number;
  /** カードグループの集約ステータス（payment type のみ） */
  status?: PaymentStatus;
}

/** ダッシュボードデータ全体 */
export interface DashboardData {
  selectedMonth: string;
  cycle: SalaryCycle | null;
  salaryTotal: number;
  paymentTotal: number;
  confirmedTotal: number;
  balance: number;
  confirmedBalance: number;
  statusBreakdown: {
    unconfirmed: number;
    confirmed: number;
    paid: number;
  };
  paymentsByCard: CardPaymentGroup[];
  fundFlow: FundFlowEntry[];
  budgetConsumption: Array<{
    categoryName: string;
    categoryColor: string;
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
  }>;
}

/**
 * ダッシュボード表示に必要なデータを取得・集計する
 * @param userId - 認証済みユーザーID
 * @param selectedMonth - 選択月（"YYYY-MM"形式）
 */
export async function getDashboardData(
  userId: string,
  selectedMonth: string,
): Promise<DashboardData> {
  // 1. 選択月の給料データを取得
  const salaries = await prisma.salary.findMany({
    where: { userId, month: selectedMonth },
  });

  // payDay の決定: 選択月の給料があればその payDay、なければ最新の給料レコードの payDay
  let payDay: number | null = null;
  if (salaries.length > 0) {
    payDay = salaries[0].payDay;
  } else {
    const latestSalary = await prisma.salary.findFirst({
      where: { userId },
      orderBy: { month: "desc" },
    });
    if (latestSalary) {
      payDay = latestSalary.payDay;
    }
  }

  // 2. サイクル算出
  const cycle = payDay ? calculateSalaryCycle(payDay, selectedMonth) : null;

  // 3. 手取り合計
  const salaryTotal = salaries.reduce((sum, s) => sum + s.amount, 0);

  // 4. 全カードを取得（支払い0件のカードも表示するため）
  const allCards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  // 5. 利用月 = [-2, -1, 0, +1] の4ヶ月分の支払いを取得
  const monthRange = [-2, -1, 0, 1].map((offset) =>
    addMonthsToMonth(selectedMonth, offset),
  );

  const payments = await prisma.payment.findMany({
    where: {
      userId,
      month: { in: monthRange },
    },
    include: {
      creditCard: true,
      category: true,
    },
    orderBy: [{ month: "asc" }, { sortOrder: "asc" }],
  });

  // 6. 各支払いの引き落とし日を算出し、サイクル内のものをフィルタ
  const filteredPayments = payments.filter((payment) => {
    const paymentDate = calculatePaymentDate(
      payment.month,
      payment.creditCard.paymentMonthOffset,
      payment.creditCard.paymentDay,
    );

    if (cycle) {
      // サイクルが算出できる場合: サイクル内かチェック
      return isDateInCycle(paymentDate, cycle);
    } else {
      // サイクルなし: 引き落とし月が選択月と一致するものを表示
      const paymentMonth = format(paymentDate, "yyyy-MM");
      return paymentMonth === selectedMonth;
    }
  });

  // 7. 集計
  let paymentTotal = 0;
  let confirmedTotal = 0;
  const statusBreakdown = { unconfirmed: 0, confirmed: 0, paid: 0 };

  for (const p of filteredPayments) {
    paymentTotal += p.amount;
    const status = p.status as PaymentStatus;
    if (status === "confirmed" || status === "paid") {
      confirmedTotal += p.amount;
    }
    if (status in statusBreakdown) {
      statusBreakdown[status] += p.amount;
    }
  }

  const balance = salaryTotal - paymentTotal;
  const confirmedBalance = salaryTotal - confirmedTotal;

  // 8. カードごとにグループ化（全カードを含む）
  const paymentsByCard: CardPaymentGroup[] = allCards.map((card) => {
    const cardPayments = filteredPayments
      .filter((p) => p.creditCardId === card.id)
      .map((p) => ({
        id: p.id,
        month: p.month,
        amount: p.amount,
        status: p.status,
        memo: p.memo,
        category: p.category
          ? { name: p.category.name, color: p.category.color }
          : null,
        sortOrder: p.sortOrder,
      }));

    const subtotal = cardPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      card: {
        id: card.id,
        name: card.name,
        brand: card.brand,
        sortOrder: card.sortOrder,
        paymentDay: card.paymentDay,
        paymentMonthOffset: card.paymentMonthOffset,
      },
      payments: cardPayments,
      subtotal,
    };
  });

  // 9. 資金繰り（fundFlow）
  const fundFlow: FundFlowEntry[] = [];

  // 給料日エントリ
  if (cycle && payDay) {
    fundFlow.push({
      date: cycle.start,
      type: "salary",
      label: "給料日",
      amount: salaryTotal,
      isBeforePayDay: false,
      sortOrder: -1, // 給料日は同日の支払いより前に表示
    });
  }

  // 各カードの引き落とし日エントリ（サイクル内に支払いがあるカードのみ）
  for (const cardGroup of paymentsByCard) {
    if (cardGroup.payments.length === 0) continue;

    // カードの引き落とし日を算出（代表的な支払いの利用月から計算）
    const representativePayment = cardGroup.payments[0];
    const paymentDate = calculatePaymentDate(
      representativePayment.month,
      cardGroup.card.paymentMonthOffset,
      cardGroup.card.paymentDay,
    );

    const isBeforePayDay = cycle ? paymentDate < cycle.start : false;

    // カードグループの集約ステータスを判定
    const allPaid = cardGroup.payments.every((p) => p.status === "paid");
    const allConfirmedOrPaid = cardGroup.payments.every(
      (p) => p.status === "confirmed" || p.status === "paid",
    );
    const aggregatedStatus: PaymentStatus = allPaid
      ? "paid"
      : allConfirmedOrPaid
        ? "confirmed"
        : "unconfirmed";

    fundFlow.push({
      date: paymentDate,
      type: "payment",
      label: cardGroup.card.name,
      amount: cardGroup.subtotal,
      isBeforePayDay,
      sortOrder: cardGroup.card.sortOrder,
      status: aggregatedStatus,
    });
  }

  // 日付順にソート（同日の場合は sortOrder で、給料日は最初）
  fundFlow.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.sortOrder - b.sortOrder;
  });

  // 10. 予算消化率の集計
  const budgetRecords = await prisma.budget.findMany({
    where: { userId, month: selectedMonth },
    include: { category: true },
  });

  // 選択月の支払いをカテゴリ別に集計（サイクルではなく利用月ベース）
  const monthPayments = await prisma.payment.findMany({
    where: { userId, month: selectedMonth },
  });

  const spentByCategory: Record<string, number> = {};
  for (const p of monthPayments) {
    if (p.categoryId) {
      spentByCategory[p.categoryId] = (spentByCategory[p.categoryId] ?? 0) + p.amount;
    }
  }

  const budgetConsumption = budgetRecords.map((b) => {
    const spentAmount = spentByCategory[b.categoryId] ?? 0;
    const percentage = Math.round((spentAmount / b.amount) * 100);
    return {
      categoryName: b.category.name,
      categoryColor: b.category.color,
      budgetAmount: b.amount,
      spentAmount,
      percentage,
    };
  });

  return {
    selectedMonth,
    cycle,
    salaryTotal,
    paymentTotal,
    confirmedTotal,
    balance,
    confirmedBalance,
    statusBreakdown,
    paymentsByCard,
    fundFlow,
    budgetConsumption,
  };
}
