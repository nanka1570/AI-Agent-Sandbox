export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { MONTH_PARAM_REGEX } from "@/lib/constants";
import { MonthCalendar } from "@/components/calendar/month-calendar";

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

  const [payments, cards, categories] = await Promise.all([
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
    prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const data: Record<string, { id: string; amount: number; categoryColor: string }[]> = {};
  for (const p of payments) {
    const key = format(p.usageDate, "yyyy-MM-dd");
    if (!data[key]) data[key] = [];
    data[key].push({
      id: p.id,
      amount: p.amount,
      categoryColor: p.category.color,
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
        categories={categories}
      />
    </div>
  );
}
