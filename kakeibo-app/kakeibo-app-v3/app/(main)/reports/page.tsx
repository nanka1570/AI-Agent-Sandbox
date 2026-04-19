export const dynamic = "force-dynamic";

import { format, subMonths } from "date-fns";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthJST, getNowJST } from "@/lib/utils/date";
import { MONTH_PARAM_REGEX } from "@/lib/constants";
import { CategoryPie } from "@/components/reports/category-pie";
import { MonthlyBar } from "@/components/reports/monthly-bar";
import { formatCurrency, formatMonth } from "@/lib/utils/format";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month =
    sp.month && MONTH_PARAM_REGEX.test(sp.month)
      ? sp.month
      : getCurrentMonthJST();

  const userId = await getAuthUserId();
  const recentMonths: string[] = [];
  for (let i = 5; i >= 0; i--) {
    recentMonths.push(format(subMonths(getNowJST(), i), "yyyy-MM"));
  }

  const [categoryTotals, monthPayments] = await Promise.all([
    prisma.payment.groupBy({
      by: ["categoryId"],
      where: { userId, month },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { userId, month: { in: recentMonths } },
      select: { month: true, amount: true },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const pieData = categoryTotals
    .map((t) => {
      const cat = catMap.get(t.categoryId);
      return {
        name: cat?.name ?? "不明",
        value: t._sum.amount ?? 0,
        color: cat?.color ?? "#999",
      };
    })
    .sort((a, b) => b.value - a.value);

  const barMap = new Map<string, number>();
  for (const mo of recentMonths) {
    barMap.set(mo, 0);
  }
  for (const p of monthPayments) {
    barMap.set(p.month, (barMap.get(p.month) ?? 0) + p.amount);
  }
  const barData = Array.from(barMap.entries()).map(([mo, total]) => ({
    month: mo.slice(5),
    total,
  }));

  const monthTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">レポート</h1>
        <p className="text-sm text-muted-foreground">
          支払い（利用日基準）の内訳と推移を表示します。
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          {formatMonth(month)} 合計
        </p>
        <p className="text-2xl font-bold">{formatCurrency(monthTotal)}</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">カテゴリ別内訳</h2>
        <div className="rounded-lg border bg-card p-4">
          <CategoryPie data={pieData} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">月次推移（直近 6 ヶ月）</h2>
        <div className="rounded-lg border bg-card p-4">
          <MonthlyBar data={barData} />
        </div>
      </section>
    </div>
  );
}
