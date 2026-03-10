import { prisma } from "@/lib/db";
import { DAY_LAST_OF_MONTH } from "@/lib/payment-constants";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";

export type PaymentWithCard = Payment & {
  creditCard: CreditCard;
  category: Category | null;
};

/**
 * 手取り入金日を取得する
 * 当月の手取りデータがなければ、最新の手取りレコードの payDay を使用
 * ※ 2クエリ発行するが、呼び出し元（page.tsx）では salaries を totalSalary 計算にも使うため
 *   1クエリへの統合は呼び出し元の構成に依存する。SQLite/Supabase いずれも軽量。
 */
export async function getSalaryPayDay(
  userId: string,
  currentMonth: string
): Promise<number | null> {
  const salaries = await prisma.salary.findMany({
    where: { month: currentMonth, userId },
  });
  const payDay = salaries[0]?.payDay ?? null;
  if (payDay !== null) return payDay;

  const latestSalary = await prisma.salary.findFirst({
    where: { userId },
    orderBy: { month: "desc" },
  });
  return latestSalary?.payDay ?? null;
}

/**
 * 給料サイクルの開始日・終了日を計算する
 */
export function calcSalaryCycle(
  currentMonth: string,
  salaryPayDay: number | null
): { cycleStart: Date | null; cycleEnd: Date | null; actualSalaryDay: number | null } {
  if (salaryPayDay === null) {
    return { cycleStart: null, cycleEnd: null, actualSalaryDay: null };
  }
  const [cy, cm] = currentMonth.split("-").map(Number);
  const actualSalaryDay = Math.min(salaryPayDay, new Date(cy, cm, 0).getDate());
  const cycleStart = new Date(cy, cm - 1, actualSalaryDay);
  // 次回給料日の前日まで（payDay=1 の場合は当月末日になる）
  const cycleEnd = new Date(cy, cm, actualSalaryDay - 1);
  return { cycleStart, cycleEnd, actualSalaryDay };
}

/**
 * 給料サイクルまたは引き落とし月ベースで支払いデータを取得する
 */
export async function fetchPaymentsForCycle(
  userId: string,
  currentMonth: string,
  salaryPayDay: number | null,
  options?: { orderBy?: Array<Record<string, "asc" | "desc">> }
): Promise<PaymentWithCard[]> {
  const [cy, cm] = currentMonth.split("-").map(Number);
  const { cycleStart, cycleEnd } = calcSalaryCycle(currentMonth, salaryPayDay);
  const orderBy = options?.orderBy;

  if (salaryPayDay !== null && cycleStart !== null && cycleEnd !== null) {
    // === 給料サイクルフィルター ===
    // offset最大2を考慮して currentMonth-2〜currentMonth+1 の締め月候補を取得
    const possibleClosingMonths = [-2, -1, 0, 1].map((offset) => {
      const d = new Date(cy, cm - 1 + offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const candidates = await prisma.payment.findMany({
      where: { month: { in: possibleClosingMonths }, userId },
      include: { creditCard: true, category: true },
      ...(orderBy ? { orderBy } : {}),
    });
    return candidates.filter((p) => {
      const [py, pm] = p.month.split("-").map(Number);
      const actualMonthIdx = pm - 1 + p.creditCard.paymentMonthOffset;
      const rawDay = p.creditCard.paymentDay;
      // 末日設定を実際の末日に変換
      const actualDay =
        rawDay === DAY_LAST_OF_MONTH
          ? new Date(py, actualMonthIdx + 1, 0).getDate()
          : rawDay;
      const actualDate = new Date(py, actualMonthIdx, actualDay);
      return actualDate >= cycleStart && actualDate <= cycleEnd;
    });
  } else {
    // === 引き落とし月ベースにフォールバック（給料未登録時）===
    const possibleClosingMonths = [0, 1, 2].map((offset) => {
      const d = new Date(cy, cm - 1 - offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const candidates = await prisma.payment.findMany({
      where: { month: { in: possibleClosingMonths }, userId },
      include: { creditCard: true, category: true },
      ...(orderBy ? { orderBy } : {}),
    });
    return candidates.filter((p) => {
      const [y, m] = p.month.split("-").map(Number);
      const d = new Date(y, m - 1 + p.creditCard.paymentMonthOffset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentMonth;
    });
  }
}
