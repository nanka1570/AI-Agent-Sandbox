export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAdjacentMonths, getCurrentMonthJST } from "@/lib/utils/date";
import { MONTH_PARAM_REGEX } from "@/lib/constants";
import { ReconcilePanel } from "@/components/reconcile/reconcile-panel";

export default async function ReconcilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const month =
    sp.month && MONTH_PARAM_REGEX.test(sp.month)
      ? sp.month
      : getCurrentMonthJST();

  const userId = await getAuthUserId();

  const card = await prisma.creditCard.findFirst({
    where: { id, userId },
    select: { id: true, name: true, accountId: true },
  });
  if (!card) notFound();

  const [payments, statement, accounts] = await Promise.all([
    prisma.payment.findMany({
      where: { userId, creditCardId: id, month },
      orderBy: { usageDate: "asc" },
      select: {
        id: true,
        usageDate: true,
        amount: true,
        memo: true,
        category: { select: { name: true } },
      },
    }),
    prisma.creditCardStatement.findFirst({
      where: { userId, creditCardId: id, month },
      select: {
        id: true,
        confirmedAmount: true,
        withdrawnAmount: true,
        withdrawnAt: true,
      },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, balance: true },
    }),
  ]);

  const months = getAdjacentMonths(month, [-3, -2, -1, 0, 1, 2]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{card.name} の照合</h1>
        <p className="text-sm text-muted-foreground">
          利用明細と確定請求額を突合し、引落を記録します。
        </p>
      </div>
      <ReconcilePanel
        cardId={card.id}
        cardName={card.name}
        month={month}
        months={months}
        payments={payments.map((p) => ({
          id: p.id,
          usageDate: format(p.usageDate, "yyyy-MM-dd"),
          amount: p.amount,
          memo: p.memo,
          categoryName: p.category.name,
        }))}
        statement={{
          id: statement?.id ?? null,
          confirmedAmount: statement?.confirmedAmount ?? 0,
          withdrawnAmount: statement?.withdrawnAmount ?? null,
          withdrawnAt: statement?.withdrawnAt ?? null,
        }}
        accounts={accounts}
        defaultAccountId={card.accountId}
      />
    </div>
  );
}
