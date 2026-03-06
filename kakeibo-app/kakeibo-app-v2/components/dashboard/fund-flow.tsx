import { format } from "date-fns";
import { AlertTriangle, Wallet, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardData } from "@/lib/utils/dashboard";

interface FundFlowProps {
  fundFlow: DashboardData["fundFlow"];
}

/**
 * 資金繰りセクション
 * 給料日と各カードの引き落とし日を時系列で表示
 * 給料日より前の引き落としには警告アイコンを表示
 */
export function FundFlow({ fundFlow }: FundFlowProps) {
  if (fundFlow.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-bold">
        データがありません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {fundFlow.map((entry, index) => {
        const isSalary = entry.type === "salary";

        return (
          <div
            key={`${entry.type}-${entry.label}-${index}`}
            className={`flex items-center gap-3 rounded-lg border-2 border-foreground px-4 py-3 ${
              isSalary
                ? "bg-[oklch(0.92_0.08_150)] shadow-[3px_3px_0px_oklch(0.40_0.15_150)]"
                : "bg-white shadow-[2px_2px_0px_oklch(0.50_0.01_280)]"
            }`}
          >
            {/* アイコン */}
            <div className="flex-shrink-0">
              {entry.isBeforePayDay && !isSalary ? (
                <span className="bg-secondary rounded-lg p-1.5 border-2 border-foreground inline-flex">
                  <AlertTriangle className="h-5 w-5 text-foreground" />
                </span>
              ) : isSalary ? (
                <span className="bg-[oklch(0.55_0.20_150)] rounded-lg p-1.5 border-2 border-foreground inline-flex">
                  <Wallet className="h-5 w-5 text-white" />
                </span>
              ) : (
                <span className="bg-accent rounded-lg p-1.5 border-2 border-foreground inline-flex">
                  <CreditCard className="h-5 w-5 text-white" />
                </span>
              )}
            </div>

            {/* 日付 */}
            <div className="flex-shrink-0 w-20 text-sm font-bold text-muted-foreground">
              {format(entry.date, "M/d")}
            </div>

            {/* ラベル */}
            <div className="flex-1 font-bold text-sm">
              {entry.label}
              {entry.isBeforePayDay && !isSalary && (
                <span className="text-xs text-primary font-bold ml-2">
                  給料日前
                </span>
              )}
            </div>

            {/* 金額 */}
            <div
              className={`font-bold text-sm ${
                isSalary ? "text-[oklch(0.40_0.18_150)]" : "text-foreground"
              }`}
            >
              {isSalary ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
