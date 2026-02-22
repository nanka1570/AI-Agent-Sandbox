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

  // 引き落とし月 = currentMonth となる締め月の候補（最大2ヶ月前まで遡る）
  const [cy, cm] = currentMonth.split("-").map(Number);
  const possibleClosingMonths = [0, 1, 2].map((offset) => {
    const d = new Date(cy, cm - 1 - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const paymentCandidates = await prisma.payment.findMany({
    where: { month: { in: possibleClosingMonths }, userId },
    include: { creditCard: true, category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const payments = paymentCandidates.filter((p) => {
    const [y, m] = p.month.split("-").map(Number);
    const d = new Date(y, m - 1 + p.creditCard.paymentMonthOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentMonth;
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
