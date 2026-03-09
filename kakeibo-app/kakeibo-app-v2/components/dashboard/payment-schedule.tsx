"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { PAYMENT_STATUS_DISPLAY, type PaymentStatus } from "@/lib/constants";
import type { DashboardData } from "@/lib/utils/dashboard";

interface PaymentScheduleProps {
  paymentsByCard: DashboardData["paymentsByCard"];
}

export function PaymentSchedule({ paymentsByCard }: PaymentScheduleProps) {
  const [openCards, setOpenCards] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    paymentsByCard.forEach((group) => {
      initial[group.card.id] = true;
    });
    return initial;
  });

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
    <div className="space-y-3 animate-fadein-3">
      {paymentsByCard.map((group) => (
        <Collapsible
          key={group.card.id}
          open={openCards[group.card.id]}
          onOpenChange={() => toggleCard(group.card.id)}
        >
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-4 py-3">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-foreground">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">切り替え</span>
                </Button>
              </CollapsibleTrigger>
              <div>
                <span className="font-medium text-sage-text">{group.card.name}</span>
                {group.card.brand && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({group.card.brand})
                  </span>
                )}
              </div>
            </div>
            <span className="font-mono font-semibold text-sage-gold tracking-wider">
              {formatCurrency(group.subtotal)}
            </span>
          </div>

          <CollapsibleContent>
            <div className="mt-1 space-y-1.5 pl-2">
              {group.payments.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  このサイクルに支払いはありません
                </p>
              ) : (
                group.payments.map((payment) => {
                  const status = payment.status as PaymentStatus;
                  const display = PAYMENT_STATUS_DISPLAY[status] || PAYMENT_STATUS_DISPLAY.unconfirmed;
                  return (
                    <div
                      key={payment.id}
                      className={`data-panel p-3 px-4 ${display.isPulsing ? "stream-bg" : ""}`}
                      style={{ borderLeft: `2px solid ${display.color}` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`status-dot ${display.isPulsing ? "animate-pulse-slow" : ""}`}
                            style={{ background: display.color, boxShadow: `0 0 6px ${display.color}66` }}
                          />
                          <div>
                            <p className="text-[13px] text-sage-text">
                              {payment.category?.name || formatMonth(payment.month)}
                            </p>
                            <p className="font-mono text-[9px] text-muted-foreground tracking-wider">
                              {formatMonth(payment.month)}
                              {payment.memo && ` · ${payment.memo}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[13px] tracking-wider text-sage-text">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className={`font-mono text-[7px] ${display.colorClass} tracking-[0.2em] ${display.isPulsing ? "animate-pulse-slow" : ""}`}>
                            {display.engLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
