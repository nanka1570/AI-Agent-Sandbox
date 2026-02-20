import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { PaymentList } from "@/components/payments/payment-list";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function PaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentMonth = params.month ?? format(new Date(), "yyyy-MM");

  // 月別の支払い一覧（クレカ情報含む）
  const payments = await prisma.payment.findMany({
    where: { month: currentMonth },
    include: { creditCard: true },
    orderBy: { createdAt: "desc" },
  });

  // クレカ一覧（登録ダイアログのセレクト用）
  const creditCards = await prisma.creditCard.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <PaymentList
      payments={payments}
      creditCards={creditCards}
      currentMonth={currentMonth}
    />
  );
}
