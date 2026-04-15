export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { PaymentList } from "@/components/payments/payment-list";
import { isPaymentStatus } from "@/lib/utils/status";

/**
 * 支払い管理ページ
 * 支払いの一覧表示・登録・編集・削除・ステータス管理を行う
 */
export default async function PaymentsPage() {
  const userId = await getAuthUserId();

  let payments: Awaited<ReturnType<typeof prisma.payment.findMany<{ include: { creditCard: { select: { name: true } }; category: { select: { name: true; color: true } } } }>>> = [];
  let creditCards: Array<{ id: string; name: string; closingDay: number; paymentDay: number; paymentMonthOffset: number; confirmationDay: number | null; confirmationMonthOffset: number | null }> = [];
  let categories: Array<{ id: string; name: string; color: string }> = [];

  try {
    // 支払い・カード・カテゴリを並列取得
    [payments, creditCards, categories] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        include: {
          creditCard: { select: { name: true } },
          category: { select: { name: true, color: true } },
        },
        orderBy: [{ month: "desc" }, { sortOrder: "asc" }],
      }),
      prisma.creditCard.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          closingDay: true,
          paymentDay: true,
          paymentMonthOffset: true,
          confirmationDay: true,
          confirmationMonthOffset: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, color: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  } catch (e) {
    console.error("PaymentsPage data fetch error:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支払い管理</h1>
        <p className="text-sm text-muted-foreground">
          クレジットカードの支払いを登録・管理します
        </p>
      </div>
      <PaymentList
        payments={payments.flatMap((p) =>
          isPaymentStatus(p.status) ? [{ ...p, status: p.status }] : []
        )}
        creditCards={creditCards}
        categories={categories}
      />
    </div>
  );
}
