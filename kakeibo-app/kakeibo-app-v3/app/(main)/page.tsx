export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAvailableMoney } from "@/lib/utils/available-money";
import { getCurrentMonthJST } from "@/lib/utils/date";
import { AvailableMoneyCard } from "@/components/dashboard/available-money-card";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/constants";

export default async function DashboardPage() {
  const userId = await getAuthUserId();
  const month = getCurrentMonthJST();

  const [
    available,
    recentPayments,
    cardsWithStatements,
    accounts,
    usageByCard,
  ] = await Promise.all([
    getAvailableMoney(userId),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { usageDate: "desc" },
      take: 5,
      select: {
        id: true,
        usageDate: true,
        amount: true,
        status: true,
        category: { select: { name: true, color: true } },
        creditCard: { select: { name: true } },
      },
    }),
    prisma.creditCard.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        statements: {
          where: { month },
          select: {
            id: true,
            confirmedAmount: true,
            withdrawnAt: true,
          },
        },
      },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, balance: true },
    }),
    prisma.payment.groupBy({
      by: ["creditCardId"],
      where: {
        userId,
        creditCardId: { not: null },
        status: { not: "paid" },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const usageMap = new Map(
    usageByCard.map((g) => [
      g.creditCardId,
      { amount: g._sum.amount ?? 0, count: g._count._all },
    ]),
  );

  return (
    <>
      {/* 桜吹雪 */}
      <Sakura />

      <div className="mx-auto max-w-5xl space-y-12 md:space-y-16">
        {/* ヒーロー */}
        <AvailableMoneyCard data={available} />

        {/* クイックアクション */}
        <section className="slide-in" style={{ animationDelay: "0.1s" }}>
          <OpHeader op="01" label="ACTION" caption="クイック操作" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ActionLink
              href="/payments"
              title="支払いを記録"
              subtitle="手入力で 1 件追加"
              code="RECORD"
            />
            <ActionLink
              href="/payments/import"
              title="CSV 明細を取込"
              subtitle="カード明細を一括登録"
              code="IMPORT"
            />
            <ActionLink
              href="/reports"
              title="月次レポート"
              subtitle="支出をグラフで確認"
              code="REPORT"
            />
          </div>
        </section>

        {/* 口座残高 */}
        {accounts.length > 0 && (
          <section className="slide-in" style={{ animationDelay: "0.15s" }}>
            <OpHeader op="02" label="ACCOUNTS" caption="口座残高" />
            <div className="mt-5 feather-card divide-y divide-[oklch(var(--border))]">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[10px] tracking-widest text-[oklch(var(--sky-deep))]">
                      ◇
                    </span>
                    <span className="font-jp text-[15px] text-foreground">
                      {a.name}
                    </span>
                  </div>
                  <span className="numeric text-[20px] text-[oklch(var(--sky-deep))]">
                    {formatCurrency(a.balance)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* カード照合 */}
        {cardsWithStatements.length > 0 && (
          <section className="slide-in" style={{ animationDelay: "0.2s" }}>
            <OpHeader op="03" label="RECONCILE" caption="今月のカード照合" />
            <div className="mt-5 feather-card divide-y divide-[oklch(var(--border))]">
              {cardsWithStatements.map((c) => {
                const stmt = c.statements[0];
                const paid = stmt?.withdrawnAt;
                const usage = usageMap.get(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/credit-cards/${c.id}/reconcile?month=${month}`}
                    className="group grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-[oklch(var(--sky)/0.12)] sm:grid-cols-[1fr_auto_auto]"
                  >
                    {/* 1列目: カード名 */}
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[10px] tracking-widest text-[oklch(var(--sss))] transition-transform group-hover:rotate-45">
                        ✕
                      </span>
                      <span className="font-jp text-[15px] font-medium text-foreground">
                        {c.name}
                      </span>
                    </div>

                    {/* 2列目: 利用合計（ぱっと見の主役） */}
                    <div className="col-start-1 row-start-2 flex items-baseline gap-2 pl-6 sm:col-start-2 sm:row-start-1 sm:flex-col sm:items-end sm:pl-0">
                      <span className="font-jp text-[10px] tracking-wider text-muted-foreground">
                        利用合計
                      </span>
                      <span className="flex items-baseline gap-1">
                        <span className="numeric text-[22px] leading-none text-foreground">
                          {formatCurrency(usage?.amount ?? 0)}
                        </span>
                        {usage && usage.count > 0 && (
                          <span className="font-jp text-[10px] text-muted-foreground">
                            / {usage.count}件
                          </span>
                        )}
                      </span>
                    </div>

                    {/* 3列目: 請求状態 + 矢印 */}
                    <div className="row-start-1 flex items-center justify-end gap-3 sm:col-start-3">
                      <div className="flex flex-col items-end">
                        <span className="font-jp text-[10px] tracking-wider text-muted-foreground">
                          請求
                        </span>
                        {stmt ? (
                          paid ? (
                            <span className="font-jp text-[13px] font-medium text-[oklch(var(--sky-deep))]">
                              引落済
                            </span>
                          ) : (
                            <span className="numeric text-[16px] text-[oklch(var(--sunset))]">
                              {formatCurrency(stmt.confirmedAmount)}
                            </span>
                          )
                        ) : (
                          <span className="font-jp text-[13px] text-muted-foreground">
                            未入力
                          </span>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className="font-display text-[oklch(var(--sky-deep))] transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 最近の支払い */}
        <section className="slide-in" style={{ animationDelay: "0.25s" }}>
          <OpHeader op="04" label="RECENT" caption="最近の支払い" />
          {recentPayments.length === 0 ? (
            <div className="mt-5 feather-card border-dashed p-10 text-center">
              <p className="font-jp text-sm text-muted-foreground">
                まだ支払いが記録されていません
              </p>
              <p className="mt-2 font-hand text-base text-[oklch(var(--sss))]">
                lets start the battle
              </p>
            </div>
          ) : (
            <div className="mt-5 feather-card divide-y divide-[oklch(var(--border))]">
              {recentPayments.map((p) => {
                const st =
                  PAYMENT_STATUSES[p.status as PaymentStatus] ??
                  PAYMENT_STATUSES.unconfirmed;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4"
                  >
                    <span
                      aria-hidden
                      className="size-3 rotate-45 border-2"
                      style={{
                        borderColor: p.category.color,
                        backgroundColor: `${p.category.color}33`,
                      }}
                    />
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-jp text-[15px] font-medium text-foreground">
                        {p.category.name}
                      </span>
                      {p.creditCard?.name && (
                        <span className="font-jp text-[12px] text-[oklch(var(--sky-deep))]">
                          {p.creditCard.name}
                        </span>
                      )}
                      <span className="font-jp text-[11px] text-[oklch(var(--sss))]">
                        {st.label}
                      </span>
                    </div>
                    <span className="numeric text-[20px] text-foreground">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* フッタ: GDM 風クレジット */}
        <footer className="pt-10">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[oklch(var(--border))]" />
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[oklch(var(--sss))]" />
              <span className="font-display text-[10px] tracking-[0.3em] text-[oklch(var(--sky-deep))]">
                SHINDA SEKAI SENSEN / KAKEI BU
              </span>
              <span className="size-1.5 rounded-full bg-[oklch(var(--sss))]" />
            </div>
            <div className="h-px flex-1 bg-[oklch(var(--border))]" />
          </div>
          <p className="mt-3 text-center font-hand text-[15px] text-[oklch(var(--sunset))]">
            ここが 私たちの 世界
          </p>
        </footer>
      </div>
    </>
  );
}

function OpHeader({
  op,
  label,
  caption,
}: {
  op: string;
  label: string;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="sss-tag">OP // {op}</span>
      <h2 className="font-jp text-[20px] font-bold tracking-wide text-[oklch(var(--sky-deep))]">
        {caption}
      </h2>
      <div className="h-px flex-1 bg-[oklch(var(--border))]" />
      <span className="font-display text-[10px] tracking-[0.25em] text-[oklch(var(--sss))]">
        {label}
      </span>
    </div>
  );
}

function ActionLink({
  href,
  title,
  subtitle,
  code,
}: {
  href: string;
  title: string;
  subtitle: string;
  code: string;
}) {
  return (
    <Link
      href={href}
      className="group feather-card relative flex flex-col gap-2 overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        aria-hidden
        className="absolute right-0 top-0 red-stripe h-1 w-16 opacity-70 transition-all group-hover:w-24"
      />
      <span className="font-display text-[9px] tracking-[0.25em] text-[oklch(var(--sss))]">
        {"// "}
        {code}
      </span>
      <span className="font-jp text-[17px] font-bold text-foreground">
        {title}
      </span>
      <span className="font-jp text-[13px] text-muted-foreground">
        {subtitle}
      </span>
      <span
        aria-hidden
        className="mt-1 inline-flex items-center gap-1 font-jp text-[12px] font-medium text-[oklch(var(--sky-deep))] transition-transform group-hover:translate-x-1"
      >
        開く →
      </span>
    </Link>
  );
}

function Sakura() {
  const petals = Array.from({ length: 18 }, (_, i) => {
    const left = (i * 7 + 3) % 100;
    const duration = 12 + (i % 7) * 2;
    const delay = (i * 0.7) % 10;
    const size = 8 + (i % 4) * 3;
    return { left, duration, delay, size, id: i };
  });
  return (
    <>
      {petals.map((p) => (
        <svg
          key={p.id}
          className="sakura"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`,
            width: p.size,
            height: p.size,
          }}
          viewBox="0 0 20 20"
          fill="oklch(0.85 0.08 0 / 0.75)"
          aria-hidden
        >
          <path d="M10 2 Q 13 6 12 10 Q 16 8 18 12 Q 14 13 12 16 Q 10 13 8 16 Q 6 13 2 12 Q 4 8 8 10 Q 7 6 10 2 Z" />
        </svg>
      ))}
    </>
  );
}
