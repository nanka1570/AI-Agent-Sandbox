import { formatCurrency } from "@/lib/utils/format";
import type { AvailableMoneyResult } from "@/lib/utils/available-money";

interface AvailableMoneyCardProps {
  data: AvailableMoneyResult;
}

function Figure({
  label,
  value,
  sign,
  tone,
}: {
  label: string;
  value: number;
  sign: "+" | "−";
  tone: "sky" | "sunset" | "sss" | "navy";
}) {
  const toneClass = {
    sky: "text-[oklch(var(--sky-deep))]",
    sunset: "text-[oklch(var(--sunset))]",
    sss: "text-[oklch(var(--sss))]",
    navy: "text-[oklch(var(--foreground))]",
  }[tone];

  return (
    <div className="relative flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex size-5 items-center justify-center font-display text-[13px] leading-none ${toneClass}`}
        >
          {sign}
        </span>
        <p className="font-jp text-[13px] font-medium text-foreground">
          {label}
        </p>
      </div>
      <p className="numeric text-[24px] leading-none text-foreground md:text-[28px]">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function AvailableMoneyCard({ data }: AvailableMoneyCardProps) {
  const { total, breakdown } = data;
  const negative = total < 0;

  return (
    <section className="slide-in relative">
      {/* ヘッダ */}
      <div className="flex items-center gap-3 pb-5">
        <span className="sss-tag">OPERATION // HQ</span>
        <span className="font-jp text-[13px] font-medium text-[oklch(var(--sky-deep))]">
          今月の家計状況
        </span>
        <div className="h-px flex-1 bg-[oklch(var(--sky-deep))]" />
        <span className="font-hand text-[15px] text-[oklch(var(--sss))]">
          dont stop now
        </span>
      </div>

      <div className="feather-card relative overflow-hidden">
        {/* 装飾: 右上に夕日の光 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-[oklch(var(--sunset)/0.4)] via-[oklch(var(--sunset)/0.15)] to-transparent blur-2xl"
        />
        {/* 装飾: 左下に空の光 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-gradient-to-tr from-[oklch(var(--sky)/0.35)] via-[oklch(var(--sky)/0.1)] to-transparent blur-3xl"
        />

        {/* 赤斜線アクセント */}
        <div aria-hidden className="red-stripe absolute left-0 top-0 h-full w-1 opacity-70" />

        <div className="relative px-6 py-10 md:px-12 md:py-14">
          {/* タイトル行 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tactical font-display text-[11px] tracking-[0.3em] text-[oklch(var(--sss))]">
                AVAILABLE BUDGET
              </p>
              <h2 className="mt-3 font-jp text-[28px] font-bold tracking-wide text-[oklch(var(--sky-deep))] md:text-[34px]">
                使えるお金
              </h2>
              <p className="mt-2 max-w-md font-jp text-[13px] leading-relaxed text-muted-foreground">
                口座残高 ＋ 未到来の手取り − 未払い支払い − 請求差額
              </p>
            </div>

            {/* 羽根アイコン */}
            <svg
              aria-hidden
              viewBox="0 0 80 80"
              className="hidden size-16 opacity-50 md:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                d="M 40 10 Q 20 30 25 55 Q 40 50 55 55 Q 60 30 40 10 Z"
                className="text-[oklch(var(--sky-deep))]"
              />
              <path
                d="M 40 15 L 40 70"
                className="text-[oklch(var(--sky-deep))]"
                strokeLinecap="round"
              />
              <path
                d="M 32 35 Q 40 30 48 35"
                className="text-[oklch(var(--sss))]"
              />
            </svg>
          </div>

          {/* ヒーロー数字 */}
          <div className="mt-8 md:mt-12">
            <div className="hero-aura flex items-end gap-2 md:gap-4">
              <span
                aria-hidden
                className={`font-numeric text-[44px] leading-none md:text-[72px] ${
                  negative
                    ? "text-[oklch(var(--sss))]"
                    : "text-[oklch(var(--sky-deep))]"
                }`}
              >
                {negative ? "−" : ""}¥
              </span>
              <span
                className={`font-numeric text-[72px] leading-[0.9] md:text-[140px] ${
                  negative
                    ? "text-[oklch(var(--sss))]"
                    : "text-[oklch(var(--sky-deep))]"
                }`}
              >
                {new Intl.NumberFormat("ja-JP").format(Math.abs(total))}
              </span>
            </div>

            {/* ステータス */}
            <div className="mt-6 flex items-center gap-4 md:mt-10">
              <span className="sss-tag">STATUS</span>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[oklch(var(--sss))] via-[oklch(var(--sky-deep))] to-transparent" />
              <span
                className={`font-jp text-[13px] font-bold ${
                  negative
                    ? "text-[oklch(var(--sss))]"
                    : "text-[oklch(var(--sky-deep))]"
                }`}
              >
                {negative ? "支出超過に注意" : "今月は余裕あり"}
              </span>
            </div>
          </div>

          {/* 内訳 */}
          <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-[oklch(var(--border))] border border-[oklch(var(--border))] md:grid-cols-4 md:divide-y-0">
            <Figure
              label="口座残高"
              value={breakdown.accountsTotal}
              sign="+"
              tone="navy"
            />
            <Figure
              label="未到来の手取り"
              value={breakdown.incomingSalary}
              sign="+"
              tone="sky"
            />
            <Figure
              label="未払いの支払い"
              value={breakdown.unpaidPayments}
              sign="−"
              tone="sss"
            />
            <Figure
              label="請求差額"
              value={breakdown.statementGap}
              sign="−"
              tone="sunset"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
