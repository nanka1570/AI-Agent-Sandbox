import { prisma } from "@/lib/prisma";
import { calculateSalaryCycle } from "@/lib/utils/salary-cycle";
import { getCurrentMonthJST, getNowJST } from "@/lib/utils/date";
import { generateAllOccurrences } from "@/lib/utils/subscription-occurrences";

export interface AvailableMoneyBreakdown {
  accountsTotal: number;
  incomingSalary: number;
  unpaidPayments: number;
  statementGap: number;
  subscriptions: number;
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

  const [accounts, salaries, statements, unpaidAll, subs, overrides] =
    await Promise.all([
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
    prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        amount: true,
        source: true,
        creditCardId: true,
        accountId: true,
        categoryId: true,
        dayOfMonth: true,
        startMonth: true,
        endMonth: true,
        installmentTotal: true,
        memo: true,
      },
    }),
    prisma.subscriptionOverride.findMany({
      where: { userId },
      select: {
        subscriptionId: true,
        month: true,
        amount: true,
        skip: true,
        memo: true,
      },
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

  // Subscription 仮想 occurrence: 当月分のみを「未引落の支払い」として加算。
  // 分割払いの残債（来月以降）はここでは差し引かない。月が進むごとに自動で
  // 当月分が differs から差し引かれる。
  const occs = generateAllOccurrences(subs, currentMonth, currentMonth, overrides);
  const subscriptions = occs.reduce((sum, o) => sum + o.amount, 0);

  const total =
    accountsTotal +
    incomingSalary -
    unpaidPayments -
    statementGap -
    subscriptions;

  return {
    total,
    breakdown: {
      accountsTotal,
      incomingSalary,
      unpaidPayments,
      statementGap,
      subscriptions,
    },
  };
}
