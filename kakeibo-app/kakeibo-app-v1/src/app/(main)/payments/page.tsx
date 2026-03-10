import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/category";
import { autoMarkConfirmedOverdue, autoMarkPaidOverdue } from "@/lib/payment-auto-paid";
import { getSalaryPayDay, fetchPaymentsForCycle } from "@/lib/payment-query";
import { PaymentList } from "@/components/payments/payment-list";

type Props = {
  searchParams: Promise<{ month?: string; category?: string; q?: string }>;
};

export default async function PaymentsPage({ searchParams }: Props) {
  const userId = await requireAuth();
  const params = await searchParams;
  const currentMonth = params.month ?? format(new Date(), "yyyy-MM");
  const initialCategoryFilter = params.category ?? "";
  const initialKeyword = params.q ?? "";

  // デフォルトカテゴリを初回のみ作成
  await ensureDefaultCategories(userId);

  // 自動ステータス更新（確定日・引き落とし日を過ぎた支払いを自動更新）
  await autoMarkConfirmedOverdue(userId);
  await autoMarkPaidOverdue(userId);

  // 手取り入金日の取得（サイクルベースフィルタリングに使用）
  const salaryPayDay = await getSalaryPayDay(userId, currentMonth);

  // 支払いデータ取得（給料サイクルベース or 引き落とし月ベース）
  const payments = await fetchPaymentsForCycle(userId, currentMonth, salaryPayDay, {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

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
      initialCategoryFilter={initialCategoryFilter}
      initialKeyword={initialKeyword}
    />
  );
}
