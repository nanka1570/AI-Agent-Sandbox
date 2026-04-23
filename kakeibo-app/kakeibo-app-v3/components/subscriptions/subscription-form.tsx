"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  subscriptionSchema,
  type SubscriptionInput,
} from "@/lib/validations/subscription";
import {
  createSubscription,
  updateSubscription,
} from "@/lib/actions/subscription-actions";

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  source: "card" | "account";
  creditCardId: string | null;
  accountId: string | null;
  categoryId: string;
  dayOfMonth: number;
  startMonth: string;
  endMonth: string | null;
  memo: string | null;
}

interface CardOption {
  id: string;
  name: string;
}
interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface SubscriptionFormProps {
  subscription?: SubscriptionItem;
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionForm({
  subscription,
  cards,
  accounts,
  categories,
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionFormProps) {
  const isEditing = !!subscription;
  const [isPending, startTransition] = useTransition();

  const defaultSource: "card" | "account" = subscription
    ? subscription.source
    : cards.length > 0
      ? "card"
      : "account";
  const defaultStartMonth =
    subscription?.startMonth ?? format(new Date(), "yyyy-MM");
  const defaultDay =
    subscription?.dayOfMonth ?? Number(format(new Date(), "d"));

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: subscription?.name ?? "",
      amount: subscription?.amount ?? 0,
      source: defaultSource,
      creditCardId: subscription?.creditCardId ?? cards[0]?.id ?? null,
      accountId: subscription?.accountId ?? accounts[0]?.id ?? null,
      categoryId: subscription?.categoryId ?? categories[0]?.id ?? "",
      dayOfMonth: defaultDay,
      startMonth: defaultStartMonth,
      endMonth: subscription?.endMonth ?? null,
      memo: subscription?.memo ?? null,
    },
  });

  const watchSource = watch("source");

  useEffect(() => {
    if (open) {
      reset({
        name: subscription?.name ?? "",
        amount: subscription?.amount ?? 0,
        source: defaultSource,
        creditCardId: subscription?.creditCardId ?? cards[0]?.id ?? null,
        accountId: subscription?.accountId ?? accounts[0]?.id ?? null,
        categoryId: subscription?.categoryId ?? categories[0]?.id ?? "",
        dayOfMonth: defaultDay,
        startMonth: defaultStartMonth,
        endMonth: subscription?.endMonth ?? null,
        memo: subscription?.memo ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription, reset, cards, accounts, categories]);

  const onSubmit = (formData: SubscriptionInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateSubscription(subscription.id, formData)
        : await createSubscription(formData);

      if (result.success) {
        toast.success(
          isEditing ? "定期支払を更新しました" : "定期支払を登録しました",
        );
        onSuccess?.();
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
          <DialogTitle>
            {isEditing ? "定期支払を編集" : "定期支払を登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-name">名称</Label>
            <Input
              id="sub-name"
              placeholder="例: Netflix / PCローン 残35回"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>支払い元</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "card" ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange("card")}
                    disabled={cards.length === 0}
                  >
                    カード
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "account" ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange("account")}
                    disabled={accounts.length === 0}
                  >
                    口座引き落とし
                  </Button>
                </div>
              )}
            />
          </div>

          {watchSource === "card" ? (
            <div className="space-y-2">
              <Label>カード</Label>
              <Controller
                name="creditCardId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カードを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.creditCardId && (
                <p className="text-sm text-destructive">
                  {errors.creditCardId.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>口座</Label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="口座を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.accountId && (
                <p className="text-sm text-destructive">
                  {errors.accountId.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sub-amount">金額</Label>
            <Input
              id="sub-amount"
              type="number"
              min={1}
              placeholder="例: 1500"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sub-day">毎月の日付</Label>
              <Input
                id="sub-day"
                type="number"
                min={1}
                max={31}
                {...register("dayOfMonth", { valueAsNumber: true })}
              />
              {errors.dayOfMonth && (
                <p className="text-sm text-destructive">
                  {errors.dayOfMonth.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                31 にすると月末扱いになります。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-start">開始月</Label>
              <Input id="sub-start" type="month" {...register("startMonth")} />
              {errors.startMonth && (
                <p className="text-sm text-destructive">
                  {errors.startMonth.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-end">終了月（空欄で無期限）</Label>
            <Input
              id="sub-end"
              type="month"
              {...register("endMonth", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            />
            {errors.endMonth && (
              <p className="text-sm text-destructive">
                {errors.endMonth.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              分割ローンの場合は最終回の月を指定してください。
            </p>
          </div>

          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea {...register("memo")} />
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
