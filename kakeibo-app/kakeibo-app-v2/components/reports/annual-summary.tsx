import { formatCurrency } from "@/lib/utils/format";

interface AnnualSummaryProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export function AnnualSummary({ summary }: AnnualSummaryProps) {
  return (
    <div className="data-panel p-4">
      <div className="bracket-frame">
        <div className="grid grid-cols-3 gap-4 text-center py-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
              INCOME
            </p>
            <p className="font-mono text-lg text-sage-success font-bold">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
              EXPENSE
            </p>
            <p className="font-mono text-lg text-sage-amber font-bold">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
              BALANCE
            </p>
            <p
              className={`font-mono text-lg font-bold ${summary.balance >= 0 ? "text-sage-gold-bright" : "text-destructive"}`}
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>
      <div className="bracket-bottom" />
    </div>
  );
}
