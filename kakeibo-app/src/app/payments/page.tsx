import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureDefaultCategories, getCategories } from "@/lib/actions/category";
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

  // 月別の支払い一覧（クレカ・カテゴリ情報含む）
  const payments = await prisma.payment.findMany({
    where: { month: currentMonth, userId },
    include: { creditCard: true, category: true },
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
    />
  );
}
