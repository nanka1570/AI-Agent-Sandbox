import { format, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/category";
import { getBudgets } from "@/lib/actions/budget";
import { BudgetManager } from "@/components/budget/budget-manager";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function BudgetPage({ searchParams }: Props) {
  const userId = await requireAuth();
  const params = await searchParams;
  const currentMonth = params.month ?? format(new Date(), "yyyy-MM");

  // デフォルトカテゴリを初回のみ作成
  await ensureDefaultCategories(userId);

  // カテゴリ一覧
  const categories = await getCategories(userId);

  // 月別予算一覧
  const budgets = await getBudgets(userId, currentMonth);

  // 前月の予算一覧（デフォルト値として使用）
  const prevMonth = format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM");
  const prevMonthBudgets = await getBudgets(userId, prevMonth);

  // 当月の支払い一覧（実績計算用）
  const payments = await prisma.payment.findMany({
    where: { userId, month: currentMonth },
  });

  return (
    <BudgetManager
      categories={categories}
      budgets={budgets}
      prevMonthBudgets={prevMonthBudgets}
      payments={payments}
      currentMonth={currentMonth}
    />
  );
}
