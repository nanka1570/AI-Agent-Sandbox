export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentList } from "@/components/payments/payment-list";
import { generateAllOccurrences } from "@/lib/utils/subscription-occurrences";
import { getCurrentMonthJST, addMonthsToMonth } from "@/lib/utils/date";

export default async function PaymentsPage() {
  const userId = await getAuthUserId();

  const currentMonth = getCurrentMonthJST();
  const horizon = addMonthsToMonth(currentMonth, 2);

  const [payments, cards, accounts, categories, subs, overrides] =
    await Promise.all([
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
    prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        amount: true,
        source: true,
        creditCardId: true,
        accountId: true,
        categoryId: true,
        dayOfMonth: true,
        startMonth: true,
        endMonth: true,
        installmentTotal: true,
        memo: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.subscriptionOverride.findMany({
      where: { userId, month: { gte: currentMonth, lte: horizon } },
      select: {
        subscriptionId: true,
        month: true,
        amount: true,
        skip: true,
        memo: true,
      },
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

  const occs = generateAllOccurrences(subs, currentMonth, horizon, overrides);
  const subMetaById = new Map(subs.map((s) => [s.id, s]));
  const virtualPayments = occs.map((o) => {
    const sub = subMetaById.get(o.subscriptionId);
    return {
      subscriptionId: o.subscriptionId,
      month: o.month,
      usageDate: o.usageDate,
      amount: o.amount,
      baseAmount: sub?.amount ?? o.amount,
      overridden: o.overridden,
      installmentNumber: o.installmentNumber,
      installmentTotal: o.installmentTotal,
      source: o.source,
      creditCardId: o.creditCardId,
      accountId: o.accountId,
      name: sub?.name ?? "定期",
      categoryName: sub?.category.name ?? "",
      categoryColor: sub?.category.color ?? "#9ca3af",
      cardName:
        o.source === "card" && o.creditCardId
          ? (cards.find((c) => c.id === o.creditCardId)?.name ?? null)
          : null,
      accountName:
        o.source === "account" && o.accountId
          ? (accounts.find((a) => a.id === o.accountId)?.name ?? null)
          : null,
      memo: o.memo,
    };
  });

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
        subscriptions={virtualPayments}
        cards={cards}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
