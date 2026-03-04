import type { Budget, Category, Payment } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type BudgetWithCategory = Budget & { category: Category };

type Props = {
  budgets: BudgetWithCategory[];
  payments: Payment[];
};

/**
 * カテゴリ別予算消化率プログレスバー
 * ダッシュボードで使用するServer Component
 */
export function BudgetProgress({ budgets, payments }: Props) {
  return (
    <div className="space-y-3 border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {budgets.map((budget) => {
        // カテゴリ別の実績を計算
        const actual = payments
          .filter((p) => p.categoryId === budget.categoryId)
          .reduce((sum, p) => sum + p.amount, 0);
        const progress = budget.amount > 0 ? Math.round((actual / budget.amount) * 100) : 0;
        const isOverBudget = progress > 100;

        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: budget.category.color }}
                />
                <span className="font-bold">{budget.category.name}</span>
              </div>
              <span className={`font-mono text-xs ${isOverBudget ? "font-bold text-red-600" : "text-muted-foreground"}`}>
                {formatCurrency(actual)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={Math.min(progress, 100)}
                className={`h-2 border border-border ${isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`}
              />
              <span
                className={`min-w-[3rem] text-right text-xs font-bold ${isOverBudget ? "text-red-600" : "text-muted-foreground"}`}
              >
                {progress}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
