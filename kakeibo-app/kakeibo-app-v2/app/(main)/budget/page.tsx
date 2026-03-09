export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { CategoryList } from "@/components/categories/category-list";
import { BudgetSettings } from "@/components/budget/budget-settings";

/**
 * カテゴリ管理・予算設定ページ
 * カテゴリ一覧の下に、月別の予算設定セクションを表示する
 */
export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const rawMonth = params.month;
  const isValidMonth = rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth);
  const selectedMonth = isValidMonth ? rawMonth : getCurrentMonthJST();

  const userId = await getAuthUserId();

  // カテゴリを取得
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  // 「その他」を sortOrder に関わらず末尾にソート
  const sorted = [...categories].sort((a, b) => {
    if (a.isDefault && a.name === "その他") return 1;
    if (b.isDefault && b.name === "その他") return -1;
    return a.sortOrder - b.sortOrder;
  });

  // 選択月の予算データを取得
  const budgets = await prisma.budget.findMany({
    where: { userId, month: selectedMonth },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        <p className="text-sm text-muted-foreground">
          支払いの分類に使用するカテゴリを管理します
        </p>
      </div>
      <CategoryList categories={sorted} />

      {/* 予算設定セクション */}
      {categories.length > 0 && (
        <section>
          <div className="section-label">
            <div className="section-label-line left" />
            <div className="section-label-tag font-mono">BUDGET</div>
            <div className="section-label-line right" />
          </div>
          <div className="mt-3">
            <BudgetSettings
              categories={sorted.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
              budgets={budgets.map((b) => ({
                id: b.id,
                categoryId: b.categoryId,
                month: b.month,
                amount: b.amount,
              }))}
              selectedMonth={selectedMonth}
            />
          </div>
        </section>
      )}
    </div>
  );
}
