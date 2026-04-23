"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertSubscriptionOverride } from "@/lib/actions/subscription-actions";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
  month: string;
  baseAmount: number;
  currentAmount: number;
  overridden: boolean;
  onSuccess: () => void;
}

export function SubscriptionOverrideDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {props.open && <DialogBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({
  onOpenChange,
  subscriptionId,
  subscriptionName,
  month,
  baseAmount,
  currentAmount,
  overridden,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState<string>(String(currentAmount));
  const [isPending, startTransition] = useTransition();

  const submit = (mode: "amount" | "skip" | "reset") => {
    startTransition(async () => {
      const payload: Parameters<typeof upsertSubscriptionOverride>[0] = {
        subscriptionId,
        month,
      };
      if (mode === "skip") {
        payload.skip = true;
      } else if (mode === "reset") {
        payload.skip = false;
        payload.amount = null;
        payload.memo = null;
      } else {
        const n = Number(amount);
        if (!Number.isInteger(n) || n < 1) {
          toast.error("金額は 1 円以上の整数で入力してください");
          return;
        }
        payload.amount = n;
        payload.skip = false;
      }
      const result = await upsertSubscriptionOverride(payload);
      if (result.success) {
        toast.success(
          mode === "skip"
            ? `${month} をスキップしました`
            : mode === "reset"
              ? "今月の変更を元に戻しました"
              : "金額を変更しました",
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error ?? "更新に失敗しました");
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>今月だけ変更</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="rounded-md bg-muted/60 p-3 text-sm">
          <p className="font-medium">{subscriptionName}</p>
          <p className="text-xs text-muted-foreground">
            {month} / 基本額 {formatCurrency(baseAmount)}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="override-amount">この月の金額</Label>
          <Input
            id="override-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
          />
          <p className="text-[11px] text-muted-foreground">
            基本額と違う金額を入力すると、この月だけ上書きされます。
          </p>
        </div>
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
        <Button
          onClick={() => submit("amount")}
          disabled={isPending}
          className="w-full"
        >
          この月の金額で上書き
        </Button>
        <Button
          variant="outline"
          onClick={() => submit("skip")}
          disabled={isPending}
          className="w-full"
        >
          今月はスキップ
        </Button>
        {overridden && (
          <Button
            variant="ghost"
            onClick={() => submit("reset")}
            disabled={isPending}
            className="w-full"
          >
            今月の変更を元に戻す
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
