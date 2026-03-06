"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/constants";
import type { DashboardData } from "@/lib/utils/dashboard";

interface PaymentScheduleProps {
  paymentsByCard: DashboardData["paymentsByCard"];
}

/**
 * 支払い予定テーブル
 * カードごとに折りたたみ表示（初期状態: 全カード展開）
 */
export function PaymentSchedule({ paymentsByCard }: PaymentScheduleProps) {
  // 全カードの展開状態を管理（初期: 全て展開）
  const [openCards, setOpenCards] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    paymentsByCard.forEach((group) => {
      initial[group.card.id] = true;
    });
    return initial;
  });

  /** カードの展開/折りたたみを切り替える */
  const toggleCard = (cardId: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  if (paymentsByCard.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        カードが登録されていません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {paymentsByCard.map((group) => (
        <Collapsible
          key={group.card.id}
          open={openCards[group.card.id]}
          onOpenChange={() => toggleCard(group.card.id)}
        >
          <div className="flex items-center justify-between rounded-lg border-2 border-foreground bg-secondary/50 px-4 py-3 shadow-[2px_2px_0px_oklch(0.50_0.01_280)]">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">切り替え</span>
                </Button>
              </CollapsibleTrigger>
              <div>
                <span className="font-medium">{group.card.name}</span>
                {group.card.brand && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({group.card.brand})
                  </span>
                )}
              </div>
            </div>
            <span className="font-semibold">
              {formatCurrency(group.subtotal)}
            </span>
          </div>

          <CollapsibleContent>
            <div className="mt-1 rounded-lg border">
              {group.payments.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  このサイクルに支払いはありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>利用月</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>メモ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.payments.map((payment) => {
                        const statusConfig =
                          PAYMENT_STATUSES[payment.status as PaymentStatus];
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {formatMonth(payment.month)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {payment.category ? (
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: payment.category.color,
                                    color: payment.category.color,
                                  }}
                                >
                                  {payment.category.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {statusConfig && (
                                <Badge variant={statusConfig.variant}>
                                  {statusConfig.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {payment.memo || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
