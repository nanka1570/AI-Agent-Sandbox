"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";
import type { PaymentStatus } from "@/types";
import { formatCurrency, formatActualPaymentDate } from "@/lib/utils";
import { updateCardPaymentsStatus } from "@/lib/actions/payment";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_PRIORITY, STATUS_TRANSITIONS, DAY_LAST_OF_MONTH } from "@/lib/payment-constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentWithRelations = Payment & {
  creditCard: CreditCard;
  category: Category | null;
};

type CardGroup = {
  groupKey: string;        // グループキー（= creditCardId_closingMonth）
  cardId: string;          // creditCardId（ステータス一括更新用）
  closingMonth: string;    // 締め月（支払日表示・ステータス更新に使用）
  cardName: string;
  paymentDay: number;
  paymentMonthOffset: number;
  totalAmount: number;
  count: number;
  worstStatus: PaymentStatus;
  items: PaymentWithRelations[];
};

type Props = {
  payments: PaymentWithRelations[];
  currentMonth: string;
};

// 締め月+offset+paymentDay から実際の引き落とし日を計算（ソート用）
function calcActualPaymentDate(
  paymentDay: number,
  monthOffset: number,
  closingMonth: string
): Date {
  const [year, month] = closingMonth.split("-").map(Number);
  const actualMonthIdx = month - 1 + monthOffset;
  const actualDay =
    paymentDay === DAY_LAST_OF_MONTH
      ? new Date(year, actualMonthIdx + 1, 0).getDate()
      : paymentDay;
  return new Date(year, actualMonthIdx, actualDay);
}

function groupPayments(payments: PaymentWithRelations[]): CardGroup[] {
  const cardMap = new Map<string, CardGroup>();
  for (const p of payments) {
    // 給料サイクルでは同一カードで締め月が異なる行が存在するため、締め月単位でグループ化
    const key = `${p.creditCardId}_${p.month}`;
    const existing = cardMap.get(key);
    const pStatus = p.status as PaymentStatus;
    if (existing) {
      existing.totalAmount += p.amount;
      existing.count += 1;
      existing.items.push(p);
      if (STATUS_PRIORITY[pStatus] < STATUS_PRIORITY[existing.worstStatus]) {
        existing.worstStatus = pStatus;
      }
    } else {
      cardMap.set(key, {
        groupKey: key,
        cardId: p.creditCardId,
        closingMonth: p.month,
        cardName: p.creditCard.name,
        paymentDay: p.creditCard.paymentDay,
        paymentMonthOffset: p.creditCard.paymentMonthOffset,
        totalAmount: p.amount,
        count: 1,
        worstStatus: pStatus,
        items: [p],
      });
    }
  }
  // 実際の支払日順にソート（月をまたぐ場合も正しい順序）
  return [...cardMap.values()].sort((a, b) => {
    const dateA = calcActualPaymentDate(a.paymentDay, a.paymentMonthOffset, a.closingMonth);
    const dateB = calcActualPaymentDate(b.paymentDay, b.paymentMonthOffset, b.closingMonth);
    return dateA.getTime() - dateB.getTime();
  });
}

export function PaymentScheduleTable({ payments, currentMonth }: Props) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupPayments(payments), [payments]);

  function toggleExpand(groupKey: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <div className="border-2 border-dashed border-border bg-white p-8 text-center">
        <p className="text-muted-foreground">この月に引き落とし予定の支払いはありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-border bg-muted">
            <TableHead className="font-black">カード</TableHead>
            <TableHead className="font-black">支払い日</TableHead>
            <TableHead className="font-black">合計金額</TableHead>
            <TableHead className="font-black">ステータス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.groupKey}>
              {/* グループ行 */}
              <TableRow
                className={`border-b-2 border-border hover:bg-secondary/20 ${group.count > 1 ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => group.count > 1 && toggleExpand(group.groupKey)}
              >
                <TableCell className="font-bold">{group.cardName}</TableCell>
                <TableCell>
                  {/* 締め月ベースで正しい月日を計算 */}
                  {formatActualPaymentDate(group.paymentDay, group.paymentMonthOffset, group.closingMonth)}
                </TableCell>
                <TableCell className="font-bold font-mono">
                  <span className="flex items-center gap-1.5">
                    {formatCurrency(group.totalAmount)}
                    {group.count > 1 && (
                      <>
                        <span className="text-xs font-normal text-muted-foreground">
                          {group.count}件
                        </span>
                        {expandedIds.has(group.groupKey) ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {/* バッジクリックが行展開に伝播しないよう stopPropagation */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusBadge
                      paymentId={group.groupKey}
                      status={group.worstStatus}
                      onClickOverride={async () => {
                        const nextStatus = STATUS_TRANSITIONS[group.worstStatus];
                        const result = await updateCardPaymentsStatus(
                          group.cardId,
                          group.closingMonth,
                          nextStatus
                        );
                        if (result.success) {
                          router.refresh();
                        } else {
                          toast.error(result.error);
                        }
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>

              {/* 展開行（count > 1 かつ展開中のとき） */}
              {group.count > 1 &&
                expandedIds.has(group.groupKey) &&
                group.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-border/50 bg-secondary/30"
                  >
                    <TableCell className="pl-8 text-sm text-muted-foreground">
                      {item.memo || "—"}
                    </TableCell>
                    <TableCell />
                    <TableCell className="font-mono text-sm">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        paymentId={item.id}
                        status={item.status as PaymentStatus}
                        readonly
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
