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
 * サマリーカード3枚
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
    <div className="grid gap-4 md:grid-cols-3">
      {/* 手取り合計 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            手取り合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(salaryTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 支払い合計 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            支払い合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(paymentTotal)}
          </p>
        </CardContent>
      </Card>

      {/* 残額 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-violet-500" />
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
          <p className="text-sm text-muted-foreground mt-1">
            確定分残額: {formatCurrency(confirmedBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
