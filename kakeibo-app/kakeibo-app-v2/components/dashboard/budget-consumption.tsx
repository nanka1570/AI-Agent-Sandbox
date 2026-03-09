import { formatCurrency } from "@/lib/utils/format";
import { BUDGET_THRESHOLD_WARNING, BUDGET_THRESHOLD_DANGER } from "@/lib/constants";

interface BudgetConsumptionProps {
  items: Array<{
    categoryName: string;
    categoryColor: string;
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
  }>;
}

/**
 * 予算消化率コンポーネント
 * カテゴリごとの予算に対する支出割合をゲージで表示する
 * 80%以上で警告色、100%以上で危険色に変化
 */
export function BudgetConsumption({ items }: BudgetConsumptionProps) {
  if (items.length === 0) return null;

  return (
    <div className="data-panel p-4 space-y-3">
      {items.map((item) => {
        // 消化率に応じたカラークラスを決定
        const colorClass =
          item.percentage >= BUDGET_THRESHOLD_DANGER
            ? "bg-destructive"
            : item.percentage >= BUDGET_THRESHOLD_WARNING
              ? "bg-sage-amber"
              : "bg-sage-success";

        const textColorClass =
          item.percentage >= BUDGET_THRESHOLD_DANGER
            ? "text-destructive"
            : item.percentage >= BUDGET_THRESHOLD_WARNING
              ? "text-sage-amber"
              : "text-sage-success";

        return (
          <div key={item.categoryName} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.categoryColor }}
                />
                <span>{item.categoryName}</span>
              </div>
              <span className="font-mono text-muted-foreground">
                {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetAmount)}
              </span>
            </div>
            <div className="gauge">
              <div
                className={`gauge-fill ${colorClass}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
            <div className="text-right">
              <span className={`font-mono text-[10px] ${textColorClass}`}>
                {item.percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
