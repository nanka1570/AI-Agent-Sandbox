import { prisma } from "@/lib/prisma";
import { calculateSalaryCycle } from "@/lib/utils/salary-cycle";
import { getCurrentMonthJST, getNowJST } from "@/lib/utils/date";

export interface AvailableMoneyBreakdown {
  accountsTotal: number;
  incomingSalary: number;
  unpaidPayments: number;
  statementGap: number;
}

export interface AvailableMoneyResult {
  total: number;
  breakdown: AvailableMoneyBreakdown;
}

export async function getAvailableMoney(
  userId: string,
): Promise<AvailableMoneyResult> {
  const currentMonth = getCurrentMonthJST();
  const today = getNowJST();
  today.setHours(0, 0, 0, 0);

  const [accounts, salaries, statements, unpaidAll] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: { balance: true },
    }),
    prisma.salary.findMany({
      where: { userId, month: currentMonth },
      select: { amount: true, payDay: true, month: true },
    }),
    prisma.creditCardStatement.findMany({
      where: { userId, withdrawnAt: null },
      select: {
        month: true,
        creditCardId: true,
        confirmedAmount: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId, status: { not: "paid" } },
      select: { amount: true, creditCardId: true, month: true },
    }),
  ]);

  const accountsTotal = accounts.reduce((s, a) => s + a.balance, 0);

  const incomingSalary = salaries.reduce((s, sa) => {
    const cycle = calculateSalaryCycle(sa.payDay, sa.month);
    if (cycle.start > today) return s + sa.amount;
    return s;
  }, 0);

  const statementKeys = new Set(
    statements.map((s) => `${s.creditCardId}:${s.month}`),
  );

  const paymentsSumByKey = new Map<string, number>();
  let unpaidPayments = 0;
  for (const p of unpaidAll) {
    unpaidPayments += p.amount;
    const key = p.creditCardId ? `${p.creditCardId}:${p.month}` : null;
    if (key && statementKeys.has(key)) {
      paymentsSumByKey.set(key, (paymentsSumByKey.get(key) ?? 0) + p.amount);
    }
  }

  // statementGap: Statement 登録済×未引落月に対し、
  //   (confirmedAmount − Payment 合計) を符号そのまま加算する。
  // これにより「Payment 合計ではなく確定額で controlling」される。
  const statementGap = statements.reduce((sum, stmt) => {
    const key = `${stmt.creditCardId}:${stmt.month}`;
    const paymentsSum = paymentsSumByKey.get(key) ?? 0;
    return sum + (stmt.confirmedAmount - paymentsSum);
  }, 0);

  const total =
    accountsTotal + incomingSalary - unpaidPayments - statementGap;

  return {
    total,
    breakdown: {
      accountsTotal,
      incomingSalary,
      unpaidPayments,
      statementGap,
    },
  };
}
