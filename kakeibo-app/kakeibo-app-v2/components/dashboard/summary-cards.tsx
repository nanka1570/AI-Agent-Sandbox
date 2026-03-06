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
      <Card className="md:col-span-2 md:row-span-2 border-l-4 border-l-[oklch(0.55_0.20_150)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <span className="bg-[oklch(0.55_0.20_150)] rounded-lg p-1.5 border-2 border-foreground shadow-[2px_2px_0px_oklch(0.50_0.01_280)]">
              <Wallet className="h-4 w-4 text-white" />
            </span>
            手取り合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-[oklch(0.40_0.18_150)]">
            {formatCurrency(salaryTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 支払い合計 */}
      <Card className="md:col-span-2 border-l-4 border-l-accent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <span className="bg-accent rounded-lg p-1.5 border-2 border-foreground shadow-[2px_2px_0px_oklch(0.50_0.01_280)]">
              <CreditCard className="h-4 w-4 text-white" />
            </span>
            支払い合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-accent">
            {formatCurrency(paymentTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 残額 */}
      <Card className={`md:col-span-2 border-l-4 ${isNegativeBalance ? "border-l-destructive" : "border-l-primary"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <span className={`rounded-lg p-1.5 border-2 border-foreground shadow-[2px_2px_0px_oklch(0.50_0.01_280)] ${isNegativeBalance ? "bg-destructive" : "bg-primary"}`}>
              <PiggyBank className="h-4 w-4 text-white" />
            </span>
            残額
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {isNegativeBalance && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            <p
              className={`text-2xl font-bold ${
                isNegativeBalance ? "text-destructive" : "text-foreground"
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-bold">
            確定分残額: {formatCurrency(confirmedBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
