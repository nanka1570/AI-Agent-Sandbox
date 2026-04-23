"use client";

import { useEffect, useState, useTransition } from "react";
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
  paymentSchema,
  type PaymentInput,
} from "@/lib/validations/payment";
import {
  createPayment,
  updatePayment,
  updatePaymentGroup,
} from "@/lib/actions/payment-actions";

const LAST_INPUT_LS_KEY = "kakeibo:payment-form:last";

type LastInput = {
  source?: "card" | "account";
  creditCardId?: string;
  accountId?: string;
  categoryId?: string;
};

function loadLastInput(): LastInput {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAST_INPUT_LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLastInput(v: LastInput) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_INPUT_LS_KEY, JSON.stringify(v));
  } catch {
    // quota/private mode は無視
  }
}

export interface PaymentItem {
  id: string;
  usageDate: Date | string;
  month: string;
  amount: number;
  status: string;
  categoryId: string;
  creditCardId: string | null;
  accountId: string | null;
  memo: string | null;
  recurringGroupId?: string | null;
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

interface PaymentFormProps {
  payment?: PaymentItem;
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultUsageDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function toDateString(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return format(d, "yyyy-MM-dd");
}

export function PaymentForm({
  payment,
  cards,
  accounts,
  categories,
  defaultUsageDate,
  open,
  onOpenChange,
  onSuccess,
}: PaymentFormProps) {
  const isEditing = !!payment;
  const isRecurring = !!payment?.recurringGroupId;
  const [isPending, startTransition] = useTransition();
  const [editScope, setEditScope] = useState<"one" | "future">("one");

  const initialUsageDate = payment?.usageDate
    ? toDateString(payment.usageDate)
    : (defaultUsageDate ?? format(new Date(), "yyyy-MM-dd"));

  const pickDefaultSource = (): "card" | "account" => {
    if (payment) {
      return payment.creditCardId ? "card" : "account";
    }
    const last = loadLastInput().source;
    if (last === "card" && cards.length > 0) return "card";
    if (last === "account" && accounts.length > 0) return "account";
    return cards.length > 0 ? "card" : "account";
  };

  const pickDefaultCard = (): string | null => {
    if (payment?.creditCardId) return payment.creditCardId;
    const last = loadLastInput().creditCardId;
    if (last && cards.some((c) => c.id === last)) return last;
    return cards[0]?.id ?? null;
  };

  const pickDefaultAccount = (): string | null => {
    if (payment?.accountId && !payment.creditCardId) return payment.accountId;
    const last = loadLastInput().accountId;
    if (last && accounts.some((a) => a.id === last)) return last;
    return accounts[0]?.id ?? null;
  };

  const pickDefaultCategory = (): string | null => {
    if (payment?.categoryId) return payment.categoryId;
    const last = loadLastInput().categoryId;
    if (last && categories.some((c) => c.id === last)) return last;
    return categories[0]?.id ?? null;
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      source: pickDefaultSource(),
      creditCardId: pickDefaultCard(),
      accountId: pickDefaultAccount(),
      month: payment?.month ?? initialUsageDate.slice(0, 7),
      usageDate: initialUsageDate,
      amount: payment?.amount ?? 0,
      categoryId: pickDefaultCategory(),
      memo: payment?.memo ?? null,
    },
  });

  const watchUsageDate = watch("usageDate");
  const watchSource = watch("source");

  useEffect(() => {
    if (open) {
      reset({
        source: pickDefaultSource(),
        creditCardId: pickDefaultCard(),
        accountId: pickDefaultAccount(),
        month: payment?.month ?? initialUsageDate.slice(0, 7),
        usageDate: initialUsageDate,
        amount: payment?.amount ?? 0,
        categoryId: pickDefaultCategory(),
        memo: payment?.memo ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment, reset, cards, accounts, categories, initialUsageDate]);

  useEffect(() => {
    if (watchUsageDate) {
      setValue("month", watchUsageDate.slice(0, 7));
    }
  }, [watchUsageDate, setValue]);

  const onSubmit = (formData: PaymentInput) => {
    startTransition(async () => {
      const result = isEditing
        ? isRecurring && editScope === "future"
          ? await updatePaymentGroup(payment.id, formData)
          : await updatePayment(payment.id, formData)
        : await createPayment(formData);

      if (result.success) {
        saveLastInput({
          source: formData.source,
          creditCardId: formData.creditCardId ?? undefined,
          accountId: formData.accountId ?? undefined,
          categoryId: formData.categoryId ?? undefined,
        });
        toast.success(
          isEditing
            ? isRecurring && editScope === "future"
              ? `定期支払の未来分 ${
                  "data" in result && result.data && "count" in result.data
                    ? result.data.count
                    : ""
                } 件を更新しました`
              : "支払いを更新しました"
            : "支払いを登録しました",
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
            {isEditing ? "支払いを編集" : "支払いを登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isEditing && isRecurring && (
            <div className="space-y-2 rounded-md border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                この支払いは定期支払の一部です。適用範囲を選択してください。
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editScope === "one" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditScope("one")}
                >
                  この回だけ
                </Button>
                <Button
                  type="button"
                  variant={editScope === "future" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditScope("future")}
                >
                  この回以降すべて
                </Button>
              </div>
              {editScope === "future" && (
                <p className="text-[11px] text-muted-foreground">
                  利用日は各レコードの元の日付を維持し、金額・カテゴリ・支払い元・メモのみ一括反映します。
                </p>
              )}
            </div>
          )}

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

          <div className="space-y-2">
            <Label>{watchSource === "card" ? "利用日" : "引き落とし日"}</Label>
            <Input type="date" {...register("usageDate")} />
            {errors.usageDate && (
              <p className="text-sm text-destructive">
                {errors.usageDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>金額</Label>
            <Input
              type="number"
              min={1}
              placeholder="例: 3500"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
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
            <Label>カテゴリ</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
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
          </div>

          {!isEditing && (
            <p className="rounded-md border border-dashed bg-muted/40 p-3 text-[11px] text-muted-foreground">
              毎月同額で続く支払い（サブスク・分割ローン等）は{" "}
              <a href="/subscriptions" className="underline">
                定期支払
              </a>
              から登録してください。
            </p>
          )}

          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea {...register("memo")} />
          </div>

          <input type="hidden" {...register("month")} />

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
