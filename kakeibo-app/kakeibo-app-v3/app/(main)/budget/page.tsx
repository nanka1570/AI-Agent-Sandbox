export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { FIXED_LAST_CATEGORY_NAME, MONTH_PARAM_REGEX } from "@/lib/constants";
import { BudgetSettings } from "@/components/budget/budget-settings";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const rawMonth = params.month;
  const isValidMonth = rawMonth && MONTH_PARAM_REGEX.test(rawMonth);
  const selectedMonth = isValidMonth ? rawMonth : getCurrentMonthJST();

  const userId = await getAuthUserId();

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.budget.findMany({
      where: { userId, month: selectedMonth },
    }),
  ]);

  const sorted = [...categories].sort((a, b) => {
    if (a.isDefault && a.name === FIXED_LAST_CATEGORY_NAME) return 1;
    if (b.isDefault && b.name === FIXED_LAST_CATEGORY_NAME) return -1;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">予算</h1>
        <p className="text-sm text-muted-foreground">
          カテゴリ別に月の予算を設定します。
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          先に「カテゴリ」を登録してください。
        </div>
      ) : (
        <BudgetSettings
          categories={sorted.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
          budgets={budgets.map((b) => ({
            id: b.id,
            categoryId: b.categoryId,
            month: b.month,
            amount: b.amount,
          }))}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
}
