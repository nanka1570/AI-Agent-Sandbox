"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/format";
import { calculateStatementDiff } from "@/lib/utils/reconcile";
import {
  upsertStatement,
  recordWithdrawal,
} from "@/lib/actions/statement-actions";

interface PaymentRow {
  id: string;
  usageDate: string;
  amount: number;
  memo: string | null;
  categoryName: string;
}

interface StatementData {
  id: string | null;
  confirmedAmount: number;
  withdrawnAmount: number | null;
  withdrawnAt: Date | null;
}

interface AccountOption {
  id: string;
  name: string;
  balance: number;
}

interface ReconcilePanelProps {
  cardId: string;
  cardName: string;
  month: string;
  months: string[];
  payments: PaymentRow[];
  statement: StatementData;
  accounts: AccountOption[];
  defaultAccountId: string | null;
}

export function ReconcilePanel({
  cardId,
  cardName,
  month,
  months,
  payments,
  statement,
  accounts,
  defaultAccountId,
}: ReconcilePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmedAmount, setConfirmedAmount] = useState<string>(
    statement.confirmedAmount > 0 ? String(statement.confirmedAmount) : "",
  );
  const [withdrawnAmount, setWithdrawnAmount] = useState<string>(
    statement.withdrawnAmount ? String(statement.withdrawnAmount) : "",
  );
  const [accountId, setAccountId] = useState<string>(defaultAccountId ?? "");

  const paymentsTotal = payments.reduce((s, p) => s + p.amount, 0);
  const parsedConfirmed = parseInt(confirmedAmount, 10) || 0;
  const diff = calculateStatementDiff(paymentsTotal, parsedConfirmed);

  const handleSaveStatement = () => {
    if (parsedConfirmed <= 0) {
      toast.error("確定請求額を入力してください");
      return;
    }
    startTransition(async () => {
      const result = await upsertStatement({
        creditCardId: cardId,
        month,
        confirmedAmount: parsedConfirmed,
      });
      if (result.success) {
        toast.success("確定請求額を保存しました");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleWithdraw = () => {
    const statementId = statement.id;
    if (!statementId) {
      toast.error("先に確定請求額を保存してください");
      return;
    }
    const amount = parseInt(withdrawnAmount, 10) || 0;
    if (amount <= 0) {
      toast.error("引落額を入力してください");
      return;
    }
    if (!accountId) {
      toast.error("引落口座を選択してください");
      return;
    }
    startTransition(async () => {
      const result = await recordWithdrawal(statementId, {
        withdrawnAmount: amount,
        accountId,
      });
      if (result.success) {
        toast.success("引落を記録しました");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const changeMonth = (m: string) => {
    router.push(`/credit-cards/${cardId}/reconcile?month=${m}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Label className="text-sm">利用月</Label>
        <Select value={month} onValueChange={changeMonth}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          diff.isMatched && parsedConfirmed > 0
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{cardName} / {month}</p>
            <p className="text-lg font-bold">差額照合</p>
          </div>
          {parsedConfirmed > 0 &&
            (diff.isMatched ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="size-5" />
                <span className="font-bold">一致</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="size-5" />
                <span className="font-bold">
                  差額 {formatCurrency(Math.abs(diff.diff))}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Payment 合計</p>
            <p className="font-mono text-lg">
              {formatCurrency(paymentsTotal)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">確定請求額</p>
            <p className="font-mono text-lg">
              {parsedConfirmed > 0 ? formatCurrency(parsedConfirmed) : "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-medium">確定請求額を入力</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">金額</Label>
            <Input
              type="number"
              min={0}
              placeholder="例: 58342"
              value={confirmedAmount}
              onChange={(e) => setConfirmedAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveStatement} disabled={isPending}>
            保存
          </Button>
        </div>
      </div>

      {statement.id && !statement.withdrawnAt && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium">引落を記録</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">引落額</Label>
              <Input
                type="number"
                min={0}
                value={withdrawnAmount}
                onChange={(e) => setWithdrawnAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">引落口座</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="口座" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}（残高 {formatCurrency(a.balance)}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={isPending}
            className="mt-3 w-full"
          >
            引落を記録（口座残高を更新）
          </Button>
        </div>
      )}

      {statement.withdrawnAt && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 text-sm dark:bg-green-950/20">
          引落完了: {formatCurrency(statement.withdrawnAmount ?? 0)}（
          {statement.withdrawnAt.toLocaleDateString("ja-JP")}）
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-medium">
          利用明細（{payments.length} 件）
        </p>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            この月の支払いはありません
          </p>
        ) : (
          <div className="space-y-1">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex gap-2">
                  <span className="text-muted-foreground">
                    {p.usageDate.slice(0, 10)}
                  </span>
                  <span>{p.categoryName}</span>
                  {p.memo && (
                    <span className="text-muted-foreground">{p.memo}</span>
                  )}
                </div>
                <span className="font-mono">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
