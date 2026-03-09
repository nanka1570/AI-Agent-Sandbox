export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { getReportData } from "@/lib/utils/report";
import { MonthlyExpenseChart } from "@/components/reports/monthly-expense-chart";
import { CategoryPieChart } from "@/components/reports/category-pie-chart";
import { AnnualSummary } from "@/components/reports/annual-summary";
import { YearSelector } from "@/components/reports/year-selector";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? Number(params.year) : currentYear;
  const validYear = isNaN(year) ? currentYear : year;

  const userId = await getAuthUserId();
  const data = await getReportData(userId, validYear);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-sm text-muted-foreground">
            年間の支出傾向を分析します
          </p>
        </div>
        <YearSelector selectedYear={validYear} />
      </div>

      {/* 大賢者の声 */}
      <div className="sage-voice">
        <p className="text-[13px] leading-relaxed text-sage-text">
          <span className="text-sage-gold font-bold">解。</span>
          {validYear}年度の支出分析結果を報告します。
        </p>
      </div>

      {/* 年間サマリー */}
      <section>
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">ANNUAL SUMMARY</div>
          <div className="section-label-line right" />
        </div>
        <AnnualSummary summary={data.annualSummary} />
      </section>

      <div className="tensura-divider" />

      {/* 月別支出チャート */}
      <section>
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">MONTHLY TREND</div>
          <div className="section-label-line right" />
        </div>
        <MonthlyExpenseChart data={data.monthlyExpenses} />
      </section>

      <div className="tensura-divider" />

      {/* カテゴリ別円グラフ */}
      <section>
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">CATEGORY BREAKDOWN</div>
          <div className="section-label-line right" />
        </div>
        <CategoryPieChart data={data.categoryBreakdown} />
      </section>
    </div>
  );
}
