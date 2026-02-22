"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";
import type { PaymentStatus } from "@/types";
import { formatCurrency, formatActualPaymentDate } from "@/lib/utils";
import { updateCardPaymentsStatus } from "@/lib/actions/payment";
import { StatusBadge } from "@/components/status-badge";
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
  cardId: string;
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

// ステータス優先度: unconfirmed > confirmed > paid
const STATUS_PRIORITY: Record<string, number> = {
  unconfirmed: 0,
  confirmed: 1,
  paid: 2,
};

// ステータス遷移（循環）
const STATUS_TRANSITIONS: Record<string, string> = {
  unconfirmed: "confirmed",
  confirmed: "paid",
  paid: "unconfirmed",
};

function groupPayments(payments: PaymentWithRelations[]): CardGroup[] {
  const cardMap = new Map<string, CardGroup>();
  for (const p of payments) {
    const existing = cardMap.get(p.creditCardId);
    const pStatus = p.status as PaymentStatus;
    if (existing) {
      existing.totalAmount += p.amount;
      existing.count += 1;
      existing.items.push(p);
      if (STATUS_PRIORITY[pStatus] < STATUS_PRIORITY[existing.worstStatus]) {
        existing.worstStatus = pStatus;
      }
    } else {
      cardMap.set(p.creditCardId, {
        cardId: p.creditCardId,
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
  return [...cardMap.values()].sort((a, b) => a.paymentDay - b.paymentDay);
}

export function PaymentScheduleTable({ payments, currentMonth }: Props) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const groups = groupPayments(payments);

  function toggleExpand(cardId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
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
            <>
              {/* グループ行 */}
              <TableRow
                key={group.cardId}
                className={`border-b-2 border-border hover:bg-secondary/20 ${group.count > 1 ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => group.count > 1 && toggleExpand(group.cardId)}
              >
                <TableCell className="font-bold">{group.cardName}</TableCell>
                <TableCell>
                  {/* currentMonth = 引き落とし月のためoffset=0で表示 */}
                  {formatActualPaymentDate(group.paymentDay, 0, currentMonth)}
                </TableCell>
                <TableCell className="font-bold font-mono">
                  <span className="flex items-center gap-1.5">
                    {formatCurrency(group.totalAmount)}
                    {group.count > 1 && (
                      <>
                        <span className="text-xs font-normal text-muted-foreground">
                          {group.count}件
                        </span>
                        {expandedIds.has(group.cardId) ? (
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
                      paymentId={group.cardId}
                      status={group.worstStatus}
                      onClickOverride={async () => {
                        const nextStatus = STATUS_TRANSITIONS[group.worstStatus];
                        const result = await updateCardPaymentsStatus(
                          group.cardId,
                          currentMonth,
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
                expandedIds.has(group.cardId) &&
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
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
