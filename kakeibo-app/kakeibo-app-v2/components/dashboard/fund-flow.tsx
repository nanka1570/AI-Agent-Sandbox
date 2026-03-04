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
      <p className="text-sm text-muted-foreground">
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
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
              isSalary ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : ""
            }`}
          >
            {/* アイコン */}
            <div className="flex-shrink-0">
              {entry.isBeforePayDay && !isSalary ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : isSalary ? (
                <Wallet className="h-5 w-5 text-emerald-500" />
              ) : (
                <CreditCard className="h-5 w-5 text-blue-500" />
              )}
            </div>

            {/* 日付 */}
            <div className="flex-shrink-0 w-20 text-sm text-muted-foreground">
              {format(entry.date, "M/d")}
            </div>

            {/* ラベル */}
            <div className="flex-1 font-medium text-sm">
              {entry.label}
              {entry.isBeforePayDay && !isSalary && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                  給料日前
                </span>
              )}
            </div>

            {/* 金額 */}
            <div
              className={`font-semibold text-sm ${
                isSalary ? "text-emerald-600" : "text-foreground"
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
