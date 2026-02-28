import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/category";
import { autoMarkConfirmedOverdue, autoMarkPaidOverdue } from "@/lib/payment-auto-paid";
import { PaymentList } from "@/components/payments/payment-list";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function PaymentsPage({ searchParams }: Props) {
  const userId = await requireAuth();
  const params = await searchParams;
  const currentMonth = params.month ?? format(new Date(), "yyyy-MM");

  // デフォルトカテゴリを初回のみ作成
  await ensureDefaultCategories(userId);

  // 自動ステータス更新（確定日・引き落とし日を過ぎた支払いを自動更新）
  await autoMarkConfirmedOverdue(userId);
  await autoMarkPaidOverdue(userId);

  // 手取りデータ取得（サイクルベースフィルタリングに使用）
  const salaries = await prisma.salary.findMany({ where: { month: currentMonth, userId } });
  // その月に手取りデータがなければ、最新の手取りレコードの payDay を使用
  let salaryPayDay: number | null = salaries[0]?.payDay ?? null;
  if (salaryPayDay === null) {
    const latestSalary = await prisma.salary.findFirst({
      where: { userId },
      orderBy: { month: "desc" },
    });
    salaryPayDay = latestSalary?.payDay ?? null;
  }

  // 給料サイクル計算（ダッシュボードと同じロジック）
  const [cy, cm] = currentMonth.split("-").map(Number);
  const actualSalaryDay =
    salaryPayDay !== null ? Math.min(salaryPayDay, new Date(cy, cm, 0).getDate()) : null;
  const cycleStart = actualSalaryDay !== null ? new Date(cy, cm - 1, actualSalaryDay) : null;
  const cycleEnd = actualSalaryDay !== null ? new Date(cy, cm, actualSalaryDay - 1) : null;

  // 支払いデータ取得（給料サイクルベース or 引き落とし月ベース）
  const payments = await (async () => {
    if (salaryPayDay !== null && cycleStart !== null && cycleEnd !== null) {
      // === 給料サイクルフィルター（ダッシュボードと同じロジック）===
      const possibleClosingMonths = [-2, -1, 0, 1].map((offset) => {
        const d = new Date(cy, cm - 1 + offset, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });
      const candidates = await prisma.payment.findMany({
        where: { month: { in: possibleClosingMonths }, userId },
        include: { creditCard: true, category: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      const start = cycleStart;
      const end = cycleEnd;
      return candidates.filter((p) => {
        const [py, pm] = p.month.split("-").map(Number);
        const actualMonthIdx = pm - 1 + p.creditCard.paymentMonthOffset;
        const rawDay = p.creditCard.paymentDay;
        // 32日設定（末日）を実際の末日に変換
        const actualDay =
          rawDay === 32 ? new Date(py, actualMonthIdx + 1, 0).getDate() : rawDay;
        const actualDate = new Date(py, actualMonthIdx, actualDay);
        return actualDate >= start && actualDate <= end;
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
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return candidates.filter((p) => {
        const [y, m] = p.month.split("-").map(Number);
        const d = new Date(y, m - 1 + p.creditCard.paymentMonthOffset, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentMonth;
      });
    }
  })();

  // クレカ一覧（登録ダイアログのセレクト用、自分のカードのみ）
  const creditCards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // カテゴリ一覧（登録ダイアログのセレクト用）
  const categories = await getCategories(userId);

  return (
    <PaymentList
      payments={payments}
      creditCards={creditCards}
      categories={categories}
      currentMonth={currentMonth}
    />
  );
}
