export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentList } from "@/components/payments/payment-list";

export default async function PaymentsPage() {
  const userId = await getAuthUserId();

  const [payments, cards, accounts, categories] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { usageDate: "desc" },
      select: {
        id: true,
        usageDate: true,
        month: true,
        amount: true,
        status: true,
        categoryId: true,
        creditCardId: true,
        accountId: true,
        memo: true,
        recurringGroupId: true,
        category: { select: { name: true, color: true } },
        creditCard: { select: { name: true } },
        account: { select: { name: true } },
      },
    }),
    prisma.creditCard.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const enriched = payments.map((p) => ({
    id: p.id,
    usageDate: p.usageDate,
    month: p.month,
    amount: p.amount,
    status: p.status,
    categoryId: p.categoryId,
    creditCardId: p.creditCardId,
    accountId: p.accountId,
    memo: p.memo,
    recurringGroupId: p.recurringGroupId,
    cardName: p.creditCard?.name ?? null,
    accountName: p.account?.name ?? null,
    categoryName: p.category.name,
    categoryColor: p.category.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支払い</h1>
        <p className="text-sm text-muted-foreground">
          カード利用を 1 円単位で記録。CSV で一括取り込みもできます。
        </p>
      </div>
      <PaymentList
        payments={enriched}
        cards={cards}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
