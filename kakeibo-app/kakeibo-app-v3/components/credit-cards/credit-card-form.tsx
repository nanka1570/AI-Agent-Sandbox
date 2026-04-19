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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  creditCardSchema,
  type CreditCardInput,
} from "@/lib/validations/credit-card";
import {
  createCreditCard,
  updateCreditCard,
} from "@/lib/actions/credit-card-actions";
import { CARD_BRANDS, LAST_DAY_CODE } from "@/lib/constants";

const NO_ACCOUNT = "__none__";
const NO_BRAND = "__none__";

export interface CreditCardItem {
  id: string;
  name: string;
  brand: string | null;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
  accountId: string | null;
  memo: string | null;
  sortOrder: number;
}

interface AccountOption {
  id: string;
  name: string;
}

interface CreditCardFormProps {
  card?: CreditCardItem;
  accounts: AccountOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: CreditCardItem, isEditing: boolean) => void;
}

const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

export function CreditCardForm({
  card,
  accounts,
  open,
  onOpenChange,
  onSuccess,
}: CreditCardFormProps) {
  const isEditing = !!card;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditCardInput>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: card?.name ?? "",
      brand: card?.brand ?? null,
      closingDay: card?.closingDay ?? 15,
      paymentDay: card?.paymentDay ?? 10,
      paymentMonthOffset: card?.paymentMonthOffset ?? 1,
      confirmationDay: card?.confirmationDay ?? null,
      confirmationMonthOffset: card?.confirmationMonthOffset ?? null,
      accountId: card?.accountId ?? null,
      memo: card?.memo ?? null,
    },
  });

  const closingDay = watch("closingDay");
  const paymentDay = watch("paymentDay");
  const closingIsLast = closingDay === LAST_DAY_CODE;
  const paymentIsLast = paymentDay === LAST_DAY_CODE;

  useEffect(() => {
    if (open) {
      reset({
        name: card?.name ?? "",
        brand: card?.brand ?? null,
        closingDay: card?.closingDay ?? 15,
        paymentDay: card?.paymentDay ?? 10,
        paymentMonthOffset: card?.paymentMonthOffset ?? 1,
        confirmationDay: card?.confirmationDay ?? null,
        confirmationMonthOffset: card?.confirmationMonthOffset ?? null,
        accountId: card?.accountId ?? null,
        memo: card?.memo ?? null,
      });
    }
  }, [open, card, reset]);

  const onSubmit = (formData: CreditCardInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCreditCard(card.id, formData)
        : await createCreditCard(formData);

      if (result.success) {
        toast.success(
          isEditing ? "カードを更新しました" : "カードを登録しました",
        );
        if (result.data) {
          onSuccess?.(result.data as CreditCardItem, isEditing);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "カードを編集" : "カードを登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">カード名</Label>
            <Input
              id="card-name"
              placeholder="例: 楽天カード"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>ブランド（任意）</Label>
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_BRAND}
                  onValueChange={(val) =>
                    field.onChange(val === NO_BRAND ? null : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BRAND}>指定なし</SelectItem>
                    {CARD_BRANDS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>締め日</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="closingDay"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={
                        closingIsLast ? "" : (field.value?.toString() ?? "")
                      }
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={closingIsLast}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((d) => (
                          <SelectItem key={d} value={d.toString()}>
                            {d}日
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex items-center gap-1">
                  <Checkbox
                    checked={closingIsLast}
                    onCheckedChange={(checked) =>
                      setValue("closingDay", checked ? LAST_DAY_CODE : 15)
                    }
                  />
                  <Label className="text-xs font-normal">末</Label>
                </div>
              </div>
              {errors.closingDay && (
                <p className="text-sm text-destructive">
                  {errors.closingDay.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>支払日</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="paymentDay"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={
                        paymentIsLast ? "" : (field.value?.toString() ?? "")
                      }
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={paymentIsLast}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((d) => (
                          <SelectItem key={d} value={d.toString()}>
                            {d}日
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex items-center gap-1">
                  <Checkbox
                    checked={paymentIsLast}
                    onCheckedChange={(checked) =>
                      setValue("paymentDay", checked ? LAST_DAY_CODE : 10)
                    }
                  />
                  <Label className="text-xs font-normal">末</Label>
                </div>
              </div>
              {errors.paymentDay && (
                <p className="text-sm text-destructive">
                  {errors.paymentDay.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>支払月オフセット（締め日基準）</Label>
            <Controller
              name="paymentMonthOffset"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? "1"}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">当月</SelectItem>
                    <SelectItem value="1">翌月</SelectItem>
                    <SelectItem value="2">翌々月</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>引落先口座（任意）</Label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? NO_ACCOUNT}
                    onValueChange={(val) =>
                      field.onChange(val === NO_ACCOUNT ? null : val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ACCOUNT}>指定なし</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="card-memo">メモ（任意）</Label>
            <Textarea id="card-memo" {...register("memo")} />
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
