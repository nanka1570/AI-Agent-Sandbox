export const dynamic = "force-dynamic";

import { getAuthUserId } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/utils/dashboard";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { PaymentSchedule } from "@/components/dashboard/payment-schedule";
import { FundFlow } from "@/components/dashboard/fund-flow";
import { MagicCircleHero } from "@/components/dashboard/magic-circle-hero";

/** 魔法陣周辺の金色パーティクル設定 */
const DEFAULT_PARTICLE_SIZE = "2px";
const PARTICLES = [
  { left: "12%", top: "8%",  duration: "6s", delay: "0s",   size: DEFAULT_PARTICLE_SIZE },
  { left: "78%", top: "15%", duration: "8s", delay: "1s",   size: "3px" },
  { left: "45%", top: "30%", duration: "7s", delay: "2s",   size: DEFAULT_PARTICLE_SIZE },
  { left: "88%", top: "50%", duration: "5s", delay: "0.5s", size: "1.5px" },
  { left: "22%", top: "65%", duration: "9s", delay: "3s",   size: DEFAULT_PARTICLE_SIZE },
] as const;

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
    <div className="space-y-0 relative overflow-hidden">
      {/* パーティクル */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              animation: `fp ${p.duration} ${p.delay} ease-in-out infinite`,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      {/* 月セレクター */}
      <div className="pt-6 pb-2">
        <MonthSelector selectedMonth={selectedMonth} />
      </div>

      {/* 魔法陣ヒーロー */}
      <div className="py-4 animate-fadein-1">
        <MagicCircleHero />
        <div className="text-center mt-4">
          <h1 className="font-black text-2xl tracking-[0.2em] text-sage-gold-bright glow-gold">大賢者</h1>
          <p className="text-[10px] tracking-[0.4em] text-sage-gold mt-1" style={{ opacity: 0.55 }}>ラファエル</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mt-2">HOUSEHOLD BUDGET ANALYSIS</p>
        </div>
      </div>

      {/* 大賢者の声 */}
      <div className="px-0 pb-4 animate-fadein-2">
        <div className="sage-voice">
          <p className="text-[13px] leading-relaxed text-sage-text">
            <span className="text-sage-gold font-bold">告。</span>
            {selectedMonth.replace('-', '年').replace(/^(\d{4})年0?/, '$1年')}月度の家計データ解析が完了しました。
          </p>
        </div>
      </div>

      {/* 残高サマリー */}
      <section className="pb-2">
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">BALANCE</div>
          <div className="section-label-line right" />
        </div>
        <SummaryCards
          salaryTotal={data.salaryTotal}
          paymentTotal={data.paymentTotal}
          balance={data.balance}
          confirmedBalance={data.confirmedBalance}
        />
      </section>

      <div className="py-3"><div className="tensura-divider" /></div>

      {/* ステータス別内訳 */}
      <section className="pb-2">
        <div className="sage-voice mb-4">
          <p className="text-[13px] leading-relaxed text-sage-text">
            <span className="text-sage-gold font-bold">解。</span>
            ステータス別に分類した結果です。
          </p>
        </div>
        <StatusBreakdown statusBreakdown={data.statusBreakdown} />
      </section>

      <div className="py-3"><div className="tensura-divider" /></div>

      {/* 支払い予定 */}
      <section className="pb-2">
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">SCHEDULE</div>
          <div className="section-label-line right" />
        </div>
        <PaymentSchedule paymentsByCard={data.paymentsByCard} />
      </section>

      <div className="py-3"><div className="tensura-divider" /></div>

      {/* 資金繰り */}
      <section className="pb-2">
        <div className="sage-voice mb-4">
          <p className="text-[13px] leading-relaxed text-sage-text">
            <span className="text-sage-gold font-bold">告。</span>
            時系列による資金推移を報告します。
          </p>
        </div>
        <div className="section-label">
          <div className="section-label-line left" />
          <div className="section-label-tag font-mono">TIMELINE</div>
          <div className="section-label-line right" />
        </div>
        <FundFlow fundFlow={data.fundFlow} />
      </section>

      {/* 最終メッセージ */}
      <div className="mt-4 mb-2 animate-fadein">
        <div className="sage-voice">
          <p className="text-[13px] leading-relaxed text-sage-text">
            <span className="text-sage-gold font-bold">解。</span>
            以上で報告を終了します<span className="cursor" />
          </p>
        </div>
      </div>
    </div>
  );
}
