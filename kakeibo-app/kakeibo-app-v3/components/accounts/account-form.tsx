"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import { createAccount, updateAccount } from "@/lib/actions/account-actions";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  type AccountType,
} from "@/lib/constants";

export interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  sortOrder: number;
}

interface AccountFormProps {
  account?: AccountItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: AccountItem, isEditing: boolean) => void;
}

export function AccountForm({
  account,
  open,
  onOpenChange,
  onSuccess,
}: AccountFormProps) {
  const isEditing = !!account;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: (account?.type as AccountType) ?? "bank",
      balance: account?.balance ?? 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: account?.name ?? "",
        type: (account?.type as AccountType) ?? "bank",
        balance: account?.balance ?? 0,
      });
    }
  }, [open, account, reset]);

  const onSubmit = (formData: AccountInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateAccount(account.id, formData)
        : await createAccount(formData);

      if (result.success) {
        toast.success(
          isEditing ? "口座を更新しました" : "口座を登録しました",
        );
        if (result.data) {
          const { id, name, type, balance, sortOrder } = result.data;
          onSuccess?.({ id, name, type, balance, sortOrder }, isEditing);
        }
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "口座を編集" : "口座を登録"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">口座名</Label>
            <Input
              id="account-name"
              placeholder="例: 三菱UFJ銀行"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>種別</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-balance">残高</Label>
            <Input
              id="account-balance"
              type="number"
              placeholder="例: 300000"
              {...register("balance", { valueAsNumber: true })}
            />
            {errors.balance && (
              <p className="text-sm text-destructive">
                {errors.balance.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              残高を変更すると変更履歴が記録されます。
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending
                ? "保存中..."
                : isEditing
                  ? "更新"
                  : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
