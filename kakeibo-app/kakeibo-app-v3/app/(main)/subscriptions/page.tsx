export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";

export default async function SubscriptionsPage() {
  const userId = await getAuthUserId();

  const [subscriptions, cards, accounts, categories] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      orderBy: [{ source: "asc" }, { name: "asc" }],
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
        memo: true,
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

  const enriched = subscriptions.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    source: s.source as "card" | "account",
    creditCardId: s.creditCardId,
    accountId: s.accountId,
    categoryId: s.categoryId,
    dayOfMonth: s.dayOfMonth,
    startMonth: s.startMonth,
    endMonth: s.endMonth,
    memo: s.memo,
    categoryName: s.category.name,
    categoryColor: s.category.color,
    cardName: s.creditCard?.name ?? null,
    accountName: s.account?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">定期支払</h1>
        <p className="text-sm text-muted-foreground">
          月額サブスクリプションや分割ローンを 1 件で管理します。ダッシュボード・カレンダーに自動で仮想的な支払いとして表示されます。
        </p>
      </div>
      <SubscriptionList
        subscriptions={enriched}
        cards={cards}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
