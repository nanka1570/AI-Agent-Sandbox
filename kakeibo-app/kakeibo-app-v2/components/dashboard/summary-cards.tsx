import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { AlertTriangle, Wallet, CreditCard, PiggyBank } from "lucide-react";

interface SummaryCardsProps {
  salaryTotal: number;
  paymentTotal: number;
  balance: number;
  confirmedBalance: number;
}

/**
 * サマリーカード3枚（Bento Grid）
 * 手取り合計、支払い合計、残額を表示
 */
export function SummaryCards({
  salaryTotal,
  paymentTotal,
  balance,
  confirmedBalance,
}: SummaryCardsProps) {
  const isNegativeBalance = balance < 0;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4 md:grid-rows-2">
      {/* 手取り合計（大きいカード） */}
      <Card className="md:col-span-2 md:row-span-2 border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_6px_oklch(0.70_0.17_160_/_50%)]" />
            手取り合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-emerald-400 drop-shadow-[0_0_10px_oklch(0.70_0.17_160_/_30%)]">
            {formatCurrency(salaryTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 支払い合計 */}
      <Card className="md:col-span-2 border-l-4 border-l-cyan-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_oklch(0.75_0.18_180_/_50%)]" />
            支払い合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-cyan-400">
            {formatCurrency(paymentTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 残額 */}
      <Card className={`md:col-span-2 border-l-4 ${isNegativeBalance ? "border-l-destructive" : "border-l-primary"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PiggyBank className={`h-4 w-4 ${isNegativeBalance ? "text-destructive" : "text-violet-400"} drop-shadow-[0_0_6px_oklch(0.65_0.20_300_/_50%)]`} />
            残額
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {isNegativeBalance && (
              <AlertTriangle className="h-5 w-5 text-destructive drop-shadow-[0_0_6px_oklch(0.65_0.25_25_/_50%)]" />
            )}
            <p
              className={`text-2xl font-bold ${
                isNegativeBalance ? "text-destructive" : "text-foreground"
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            確定分残額: {formatCurrency(confirmedBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
