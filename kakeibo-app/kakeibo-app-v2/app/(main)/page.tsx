export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/utils/dashboard";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { PaymentSchedule } from "@/components/dashboard/payment-schedule";
import { FundFlow } from "@/components/dashboard/fund-flow";
import { Separator } from "@/components/ui/separator";

/**
 * ダッシュボードページ（Server Component）
 * 月ごとの収支サマリーと支払い予定を表示する
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const rawMonth = params.month;
  const isValidMonth = rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth);
  const selectedMonth = isValidMonth ? rawMonth : getCurrentMonthJST();

  const userId = await getAuthUserId();
  const data = await getDashboardData(userId, selectedMonth);

  return (
    <div className="space-y-6">
      {/* 月セレクター */}
      <MonthSelector selectedMonth={selectedMonth} />

      {/* サマリーカード */}
      <SummaryCards
        salaryTotal={data.salaryTotal}
        paymentTotal={data.paymentTotal}
        balance={data.balance}
        confirmedBalance={data.confirmedBalance}
      />

      {/* ステータス別内訳 */}
      <StatusBreakdown statusBreakdown={data.statusBreakdown} />

      <Separator />

      {/* 支払い予定テーブル */}
      <section>
        <h2 className="text-lg font-semibold mb-3">支払い予定</h2>
        <PaymentSchedule paymentsByCard={data.paymentsByCard} />
      </section>

      <Separator />

      {/* 資金繰りセクション */}
      <section>
        <h2 className="text-lg font-semibold mb-3">資金繰り</h2>
        <FundFlow fundFlow={data.fundFlow} />
      </section>
    </div>
  );
}
