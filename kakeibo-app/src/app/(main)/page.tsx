import { format, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/category";
import { getBudgets } from "@/lib/actions/budget";
import { formatCurrency, formatMonth, formatActualPaymentDate } from "@/lib/utils";
import { autoMarkConfirmedOverdue, autoMarkPaidOverdue } from "@/lib/payment-auto-paid";
import { PaymentScheduleTable } from "@/components/dashboard/payment-schedule-table";
import {
  calcTotalSalary,
  calcTotalPayment,
  calcStatusBreakdown,
  calcBalance,
  calcConfirmedBalance,
  calcMonthlyData,
  calcCategoryBreakdown,
  calcCashFlowStatus,
} from "@/lib/dashboard";
import { MonthSelector } from "@/components/month-selector";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { BudgetProgress } from "@/components/budget/budget-progress";
import { QuickInputFab } from "@/components/quick-input/quick-input-fab";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const userId = await requireAuth();
  await autoMarkConfirmedOverdue(userId);
  await autoMarkPaidOverdue(userId);
  const params = await searchParams;
  const currentMonth = params.month ?? format(new Date(), "yyyy-MM");

  // デフォルトカテゴリを初回のみ作成
  await ensureDefaultCategories(userId);

  // --- 当月データ取得 ---
  const salaries = await prisma.salary.findMany({
    where: { month: currentMonth, userId },
  });
  const totalSalary = calcTotalSalary(salaries);

  // 引き落とし月 = currentMonth となる締め月の候補（最大2ヶ月前まで遡る）
  const [cy, cm] = currentMonth.split("-").map(Number);
  const possibleClosingMonths = [0, 1, 2].map((offset) => {
    const d = new Date(cy, cm - 1 - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const paymentCandidates = await prisma.payment.findMany({
    where: { month: { in: possibleClosingMonths }, userId },
    include: { creditCard: true, category: true },
  });
  const payments = paymentCandidates.filter((p) => {
    const [y, m] = p.month.split("-").map(Number);
    const d = new Date(y, m - 1 + p.creditCard.paymentMonthOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentMonth;
  });
  const totalPayment = calcTotalPayment(payments);

  // ステータス別集計
  const statusBreakdown = calcStatusBreakdown(payments);

  // 残額
  const balance = calcBalance(totalSalary, totalPayment);
  const confirmedBalance = calcConfirmedBalance(
    totalSalary,
    statusBreakdown.confirmed,
    statusBreakdown.paid
  );

  // --- 資金繰り計算（給料日と支払日の比較） ---
  const salaryPayDay = salaries[0]?.payDay ?? null;
  const cashFlowItems =
    salaryPayDay !== null ? calcCashFlowStatus(salaryPayDay, payments) : [];

  // --- 月別支出推移（直近6ヶ月） ---
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    months.push(format(d, "yyyy-MM"));
  }

  // maxOffset=2 を考慮して 2ヶ月余分に取得し、引き落とし月でグループ化する
  const chartFetchMonths: string[] = [];
  for (let i = 7; i >= 0; i--) {
    chartFetchMonths.push(format(subMonths(new Date(), i), "yyyy-MM"));
  }
  const allPayments = await prisma.payment.findMany({
    where: { month: { in: chartFetchMonths }, userId },
    include: { creditCard: { select: { paymentMonthOffset: true } } },
  });

  const monthlyData = calcMonthlyData(
    allPayments.map((p) => ({ ...p, paymentMonthOffset: p.creditCard.paymentMonthOffset })),
    months
  ).map((d) => ({
    month: format(new Date(d.month + "-01"), "M月"),
    total: d.total,
  }));

  // --- カテゴリ別支出（当月の円グラフ用） ---
  const categoryData = calcCategoryBreakdown(payments);

  // --- 予算データ（当月） ---
  const budgets = await getBudgets(userId, currentMonth);

  // --- クイック入力用データ ---
  const creditCards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  const categories = await getCategories(userId);

  return (
    <>
      {/* ヘッダー: タイトル + 月セレクター */}
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">ダッシュボード</h1>
        <MonthSelector currentMonth={currentMonth} basePath="/" />
      </div>

      {/* サマリーカード */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 給料合計 */}
        <div className="border-2 border-border bg-emerald-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-emerald-800">給料合計</p>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-900">
            {formatCurrency(totalSalary)}
          </p>
        </div>

        {/* 支払い合計 */}
        <div className="border-2 border-border bg-rose-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-rose-800">支払い合計</p>
          <p className="mt-2 font-mono text-2xl font-black text-rose-900">
            {formatCurrency(totalPayment)}
          </p>
          <div className="mt-2 space-y-0.5 text-xs text-rose-700">
            <p>確定 {formatCurrency(statusBreakdown.confirmed)}</p>
            <p>未確定 {formatCurrency(statusBreakdown.unconfirmed)}</p>
            <p>支払済 {formatCurrency(statusBreakdown.paid)}</p>
          </div>
        </div>

        {/* 残額 */}
        <div className="border-2 border-border bg-primary p-6 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-white/80">残額</p>
          <p className="mt-2 font-mono text-2xl font-black">
            {formatCurrency(balance)}
          </p>
          <p className="mt-2 text-xs text-white/70">
            確定分残額 {formatCurrency(confirmedBalance)}
          </p>
        </div>
      </div>

      {/* 資金繰りサマリー（給料登録済みかつ支払いがある場合のみ表示） */}
      {salaryPayDay !== null && cashFlowItems.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
            <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
              資金繰り
            </span>
            今月の資金繰り
          </h2>
          <div className="border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* 給料入金日サマリー */}
            <div className="flex items-center gap-4 border-b-2 border-border bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-emerald-800">
                給料入金日：{salaryPayDay}日
              </span>
              <span className="font-mono text-sm font-bold text-emerald-900">
                合計 {formatCurrency(totalSalary)}
              </span>
            </div>
            {/* 支払い一覧 */}
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-muted">
                  <TableHead className="font-black">カード</TableHead>
                  <TableHead className="font-black">支払い日</TableHead>
                  <TableHead className="font-black">金額</TableHead>
                  <TableHead className="font-black">給料入金前後</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashFlowItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b-2 border-border hover:bg-secondary/20"
                  >
                    <TableCell className="font-bold">{item.cardName}</TableCell>
                    <TableCell>
                      {formatActualPaymentDate(item.paymentDay, item.paymentMonthOffset, currentMonth)}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      {item.isSafe ? (
                        <span className="inline-flex items-center gap-1 rounded-sm border-2 border-emerald-600 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          ✓ 入金後
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-sm border-2 border-rose-600 bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          ⚠ 入金前
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 支払い予定テーブル */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
          <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
            支払い予定
          </span>
          {formatMonth(currentMonth)} の支払い予定
        </h2>
        <PaymentScheduleTable payments={payments} currentMonth={currentMonth} />
      </div>

      {/* グラフ */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <MonthlyChart data={monthlyData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* 広告スペース */}
      <AdBanner />

      {/* カテゴリ別予算消化率 */}
      {budgets.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
            <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
              予算消化
            </span>
            予算消化率
          </h2>
          <BudgetProgress budgets={budgets} payments={payments} />
        </div>
      )}

      {/* クイック入力FAB */}
      <QuickInputFab creditCards={creditCards} categories={categories} />
    </>
  );
}
