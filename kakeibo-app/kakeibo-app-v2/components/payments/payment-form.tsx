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
import { paymentFormSchema, type PaymentFormInput } from "@/lib/validations/payment";
import {
  createPayment,
  updatePayment,
  createRecurringPayments,
} from "@/lib/actions/payment-actions";
import { RECURRING_PAYMENT_COUNT, LAST_DAY_CODE } from "@/lib/constants";
import { addMonthsToMonth } from "@/lib/utils/date";

interface CreditCardWithDates {
  id: string;
  name: string;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
}

interface PaymentFormProps {
  /** 編集対象の支払い（新規作成時は undefined） */
  payment?: {
    id: string;
    creditCardId: string;
    month: string;
    amount: number;
    categoryId: string | null;
    memo: string | null;
    isRecurring: boolean;
    recurringGroupId: string | null;
  };
  creditCards: CreditCardWithDates[];
  categories: Array<{ id: string; name: string; color: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDay(day: number): string {
  return day === LAST_DAY_CODE ? "末日" : `${day}日`;
}

function formatMonthOffset(offset: number): string {
  switch (offset) {
    case 0: return "当月";
    case 1: return "翌月";
    case 2: return "翌々月";
    default: return `+${offset}ヶ月`;
  }
}

/**
 * 支払い登録・編集フォームダイアログ
 * 新規作成時は繰り返し登録チェックボックスを表示
 */
export function PaymentForm({
  payment,
  creditCards,
  categories,
  open,
  onOpenChange,
}: PaymentFormProps) {
  const isEditing = !!payment;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      creditCardId: payment?.creditCardId ?? "",
      month: payment?.month ?? "",
      amount: payment?.amount ?? 0,
      categoryId: payment?.categoryId ?? null,
      memo: payment?.memo ?? null,
      isRecurring: false,
    },
  });

  const isRecurring = watch("isRecurring");
  const watchedCardId = watch("creditCardId");
  const watchedMonth = watch("month");
  const selectedCard = creditCards.find((c) => c.id === watchedCardId) ?? null;

  // ダイアログが開くたびにフォームをリセット
  useEffect(() => {
    if (open) {
      reset({
        creditCardId: payment?.creditCardId ?? "",
        month: payment?.month ?? "",
        amount: payment?.amount ?? 0,
        categoryId: payment?.categoryId ?? null,
        memo: payment?.memo ?? null,
        isRecurring: false,
      });
    }
  }, [open, payment, reset]);

  /** フォーム送信処理 */
  const onSubmit = (formData: PaymentFormInput) => {
    startTransition(async () => {
      let result;

      if (isEditing) {
        result = await updatePayment(payment.id, formData);
      } else if (formData.isRecurring) {
        result = await createRecurringPayments({
          ...formData,
          isRecurring: true,
        });
      } else {
        result = await createPayment(formData);
      }

      if (result.success) {
        const message = isEditing
          ? "支払いを更新しました"
          : formData.isRecurring
            ? `繰り返し支払い（${RECURRING_PAYMENT_COUNT}件）を登録しました`
            : "支払いを登録しました";
        toast.success(message);
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
            {isEditing ? "支払いを編集" : "支払いを登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* カード選択 */}
          <div className="space-y-2">
            <Label>カード</Label>
            <Controller
              name="creditCardId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カードを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
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

          {/* 利用月 */}
          <div className="space-y-2">
            <Label htmlFor="payment-month">利用月</Label>
            <Input
              id="payment-month"
              type="month"
              className="cursor-pointer"
              onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
              {...register("month")}
            />
            {errors.month && (
              <p className="text-sm text-destructive">
                {errors.month.message}
              </p>
            )}
          </div>

          {/* カード・利用月選択後に締め日/確定日/支払日を表示 */}
          {selectedCard && watchedMonth && (
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>締め日</span>
                <span>{Number(watchedMonth.split("-")[1])}月 {formatDay(selectedCard.closingDay)}</span>
              </div>
              {selectedCard.confirmationDay != null && selectedCard.confirmationMonthOffset != null && (
                <div className="flex justify-between text-muted-foreground">
                  <span>確定日</span>
                  <span>
                    {formatMonthOffset(selectedCard.confirmationMonthOffset)}{" "}
                    {formatDay(selectedCard.confirmationDay)}
                    <span className="text-muted-foreground/60 ml-1">
                      ({addMonthsToMonth(watchedMonth, selectedCard.confirmationMonthOffset).replace("-", "年").replace(/^(\d{4})年0?/, "$1年")}月)
                    </span>
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>支払日</span>
                <span>
                  {formatMonthOffset(selectedCard.paymentMonthOffset)}{" "}
                  {formatDay(selectedCard.paymentDay)}
                  <span className="text-muted-foreground/60 ml-1">
                    ({addMonthsToMonth(watchedMonth, selectedCard.paymentMonthOffset).replace("-", "年").replace(/^(\d{4})年0?/, "$1年")}月)
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">金額</Label>
            <Input
              id="payment-amount"
              type="number"
              min={1}
              placeholder="0"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* カテゴリ選択（任意） */}
          <div className="space-y-2">
            <Label>カテゴリ（任意）</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="未選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="payment-memo">メモ（任意）</Label>
            <Textarea
              id="payment-memo"
              placeholder="メモを入力"
              {...register("memo")}
            />
            {errors.memo && (
              <p className="text-sm text-destructive">
                {errors.memo.message}
              </p>
            )}
          </div>

          {/* 繰り返しチェックボックス（新規のみ） */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label className="text-sm font-normal">
                繰り返し登録（指定月から{RECURRING_PAYMENT_COUNT}ヶ月分を一括登録）
              </Label>
            </div>
          )}

          {/* 繰り返し説明文 */}
          {!isEditing && isRecurring && (
            <p className="text-xs text-muted-foreground rounded-md bg-muted p-3">
              指定した利用月を起点に、翌月・翌々月・3ヶ月後の計{RECURRING_PAYMENT_COUNT}件が同じ内容で登録されます。
              同一の繰り返しグループとして管理され、一括削除が可能です。
            </p>
          )}

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
                  : isRecurring
                    ? `${RECURRING_PAYMENT_COUNT}件登録`
                    : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
