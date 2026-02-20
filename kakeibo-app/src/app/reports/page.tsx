import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import {
  calcYearlySummary,
  calcMonthlyBreakdown,
  calcCategoryRanking,
} from "@/lib/reports";
import { YearSelector } from "@/components/year-selector";
import { YearlyLineChart } from "@/components/charts/yearly-line-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const userId = await requireAuth();
  const params = await searchParams;
  const year = params.year ?? new Date().getFullYear().toString();

  // 選択された年の全12ヶ月
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  );

  // 全月の給料と支払いを取得
  const salaries = await prisma.salary.findMany({
    where: { userId, month: { in: months } },
  });
  const payments = await prisma.payment.findMany({
    where: { userId, month: { in: months } },
    include: { creditCard: true, category: true },
  });

  // 集計
  const yearlySummary = calcYearlySummary(salaries, payments);
  const monthlyBreakdown = calcMonthlyBreakdown(salaries, payments, months);
  const categoryRanking = calcCategoryRanking(payments);

  // 折れ線グラフ用データ（1月〜12月）
  const lineChartData = monthlyBreakdown.map((m) => ({
    month: `${parseInt(m.month.split("-")[1])}月`,
    amount: m.expense,
  }));

  return (
    <>
      {/* ヘッダー: タイトル + 年セレクター */}
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">レポート</h1>
        <YearSelector currentYear={year} basePath="/reports" />
      </div>

      {/* 年間サマリーカード */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 年間収入 */}
        <div className="border-2 border-border bg-emerald-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-emerald-800">年間収入</p>
          <p className="mt-2 font-mono text-2xl font-black text-emerald-900">
            {formatCurrency(yearlySummary.totalIncome)}
          </p>
        </div>

        {/* 年間支出 */}
        <div className="border-2 border-border bg-rose-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-rose-800">年間支出</p>
          <p className="mt-2 font-mono text-2xl font-black text-rose-900">
            {formatCurrency(yearlySummary.totalExpense)}
          </p>
        </div>

        {/* 年間収支 */}
        <div className="border-2 border-border bg-primary p-6 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-white/80">年間収支</p>
          <p className="mt-2 font-mono text-2xl font-black">
            {formatCurrency(yearlySummary.balance)}
          </p>
        </div>
      </div>

      {/* 月別支出推移グラフ */}
      <div className="mt-8">
        <YearlyLineChart data={lineChartData} />
      </div>

      {/* カテゴリ別年間ランキング */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
          <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
            ランキング
          </span>
          カテゴリ別年間ランキング
        </h2>
        {categoryRanking.length === 0 ? (
          <div className="border-2 border-dashed border-border bg-white p-8 text-center">
            <p className="text-muted-foreground">データがありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-muted">
                  <TableHead className="w-16 font-black">順位</TableHead>
                  <TableHead className="font-black">カテゴリ</TableHead>
                  <TableHead className="font-black text-right">年間合計</TableHead>
                  <TableHead className="w-24 font-black text-right">割合</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRanking.map((item) => (
                  <TableRow
                    key={item.name}
                    className="border-b-2 border-border hover:bg-secondary/20"
                  >
                    <TableCell className="font-mono font-bold">
                      {item.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-right">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      {item.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 月次詳細セクション */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
          <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
            月次詳細
          </span>
          月次詳細
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {monthlyBreakdown.map((m) => {
            const monthNum = parseInt(m.month.split("-")[1]);
            const hasData = m.income > 0 || m.expense > 0;

            return (
              <div
                key={m.month}
                className={`border-2 border-border bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  !hasData ? "opacity-50" : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-black">{monthNum}月</h3>
                  {m.expenseDiff !== null && m.expenseDiff !== 0 && hasData && (
                    <span
                      className={`text-sm font-bold ${
                        m.expenseDiff > 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {m.expenseDiff > 0 ? "+" : ""}
                      {formatCurrency(m.expenseDiff)}
                      {m.expenseDiff > 0 ? " ↑" : " ↓"}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-bold">収入</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(m.income)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-700 font-bold">支出</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(m.expense)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="font-bold">収支</span>
                    <span
                      className={`font-mono font-bold ${
                        m.balance >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(m.balance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
