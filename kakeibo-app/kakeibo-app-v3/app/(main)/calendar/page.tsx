export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { MONTH_PARAM_REGEX } from "@/lib/constants";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { generateAllOccurrences } from "@/lib/utils/subscription-occurrences";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month =
    sp.month && MONTH_PARAM_REGEX.test(sp.month)
      ? sp.month
      : getCurrentMonthJST();

  const userId = await getAuthUserId();

  const [year, m] = month.split("-").map(Number);
  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 0, 23, 59, 59, 999);

  const [payments, cards, accounts, categories, subs, overrides] =
    await Promise.all([
    prisma.payment.findMany({
      where: {
        userId,
        usageDate: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true,
        usageDate: true,
        amount: true,
        category: { select: { color: true } },
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
        memo: true,
        category: { select: { color: true } },
      },
    }),
    prisma.subscriptionOverride.findMany({
      where: { userId, month },
      select: {
        subscriptionId: true,
        month: true,
        amount: true,
        skip: true,
        memo: true,
      },
    }),
  ]);

  const data: Record<
    string,
    { id: string; amount: number; categoryColor: string; virtual?: boolean }[]
  > = {};
  for (const p of payments) {
    const key = format(p.usageDate, "yyyy-MM-dd");
    if (!data[key]) data[key] = [];
    data[key].push({
      id: p.id,
      amount: p.amount,
      categoryColor: p.category.color,
    });
  }

  const occs = generateAllOccurrences(subs, month, month, overrides);
  const catColorById = new Map(subs.map((s) => [s.id, s.category.color]));
  for (const o of occs) {
    const key = format(o.usageDate, "yyyy-MM-dd");
    if (!data[key]) data[key] = [];
    data[key].push({
      id: `sub:${o.subscriptionId}:${o.month}`,
      amount: o.amount,
      categoryColor: catColorById.get(o.subscriptionId) ?? "#9ca3af",
      virtual: true,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          日付をタップで支払いを登録。色ドットはカテゴリを表します。
        </p>
      </div>
      <MonthCalendar
        month={month}
        data={data}
        cards={cards}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
