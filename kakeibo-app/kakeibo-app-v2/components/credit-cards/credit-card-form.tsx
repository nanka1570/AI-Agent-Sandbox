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

interface CreditCardItem {
  id: string;
  name: string;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
  brand: string | null;
  memo: string | null;
  sortOrder: number;
}

interface CreditCardFormProps {
  /** 編集対象のカード（新規作成時は undefined） */
  card?: {
    id: string;
    name: string;
    closingDay: number;
    paymentDay: number;
    paymentMonthOffset: number;
    confirmationDay: number | null;
    confirmationMonthOffset: number | null;
    brand: string | null;
    memo: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 作成・更新成功時のコールバック */
  onSuccess?: (data: CreditCardItem, isEditing: boolean) => void;
}

/** 1〜31の数値配列を生成する */
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

/** 日選択 UI コンポーネント */
function DaySelect({
  name,
  label,
  isLastDay,
  onLastDayChange,
  control,
  errors,
}: {
  name: "closingDay" | "paymentDay" | "confirmationDay";
  label: string;
  isLastDay: boolean;
  onLastDayChange: (checked: boolean) => void;
  control: ReturnType<typeof useForm<CreditCardInput>>["control"];
  errors: ReturnType<typeof useForm<CreditCardInput>>["formState"]["errors"];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={
                isLastDay ? "" : (field.value?.toString() ?? "")
              }
              onValueChange={(val) => field.onChange(Number(val))}
              disabled={isLastDay}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="日" />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}日
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isLastDay}
            onCheckedChange={(checked) => onLastDayChange(!!checked)}
          />
          <Label className="text-sm font-normal">末日</Label>
        </div>
      </div>
      {errors[name] && (
        <p className="text-sm text-destructive">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
}

export function CreditCardForm({
  card,
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
      closingDay: card?.closingDay ?? 15,
      paymentDay: card?.paymentDay ?? 10,
      paymentMonthOffset: card?.paymentMonthOffset ?? 1,
      confirmationDay: card?.confirmationDay ?? null,
      confirmationMonthOffset: card?.confirmationMonthOffset ?? null,
      brand: card?.brand ?? null,
      memo: card?.memo ?? null,
    },
  });

  const closingDay = watch("closingDay");
  const paymentDay = watch("paymentDay");
  const confirmationDay = watch("confirmationDay");

  // 末日チェック状態の管理
  const isClosingLastDay = closingDay === LAST_DAY_CODE;
  const isPaymentLastDay = paymentDay === LAST_DAY_CODE;
  const hasConfirmation = confirmationDay !== null && confirmationDay !== undefined;
  const isConfirmationLastDay = confirmationDay === LAST_DAY_CODE;

  // ダイアログが開くたびにフォームをリセット
  useEffect(() => {
    if (open) {
      reset({
        name: card?.name ?? "",
        closingDay: card?.closingDay ?? 15,
        paymentDay: card?.paymentDay ?? 10,
        paymentMonthOffset: card?.paymentMonthOffset ?? 1,
        confirmationDay: card?.confirmationDay ?? null,
        confirmationMonthOffset: card?.confirmationMonthOffset ?? null,
        brand: card?.brand ?? null,
        memo: card?.memo ?? null,
      });
    }
  }, [open, card, reset]);

  /** フォーム送信処理 */
  const onSubmit = (formData: CreditCardInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCreditCard(card.id, formData)
        : await createCreditCard(formData);

      if (result.success) {
        toast.success(
          isEditing ? "カードを更新しました" : "カードを追加しました"
        );
        if (result.data) {
          const { id, name, closingDay, paymentDay, paymentMonthOffset, confirmationDay, confirmationMonthOffset, brand, memo, sortOrder } = result.data;
          onSuccess?.({ id, name, closingDay, paymentDay, paymentMonthOffset, confirmationDay, confirmationMonthOffset, brand, memo, sortOrder }, isEditing);
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
            {isEditing ? "カードを編集" : "カードを追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* カード名 */}
          <div className="space-y-2">
            <Label htmlFor="card-name">カード名</Label>
            <Input
              id="card-name"
              placeholder="例: 楽天カード"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 締め日 */}
          <DaySelect
            name="closingDay"
            label="締め日"
            isLastDay={isClosingLastDay}
            onLastDayChange={(checked) =>
              setValue("closingDay", checked ? 32 : 15)
            }
            control={control}
            errors={errors}
          />

          {/* 支払日 */}
          <DaySelect
            name="paymentDay"
            label="支払日"
            isLastDay={isPaymentLastDay}
            onLastDayChange={(checked) =>
              setValue("paymentDay", checked ? 32 : 10)
            }
            control={control}
            errors={errors}
          />

          {/* 支払月オフセット */}
          <div className="space-y-2">
            <Label>支払月（締め月からのオフセット）</Label>
            <Controller
              name="paymentMonthOffset"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value.toString()}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger className="w-32">
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
            {errors.paymentMonthOffset && (
              <p className="text-sm text-destructive">
                {errors.paymentMonthOffset.message}
              </p>
            )}
          </div>

          {/* 確定日（任意） */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasConfirmation}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setValue("confirmationDay", 20);
                    setValue("confirmationMonthOffset", 0);
                  } else {
                    setValue("confirmationDay", null);
                    setValue("confirmationMonthOffset", null);
                  }
                }}
              />
              <Label className="text-sm font-normal">確定日を設定する</Label>
            </div>
            {hasConfirmation && (
              <div className="ml-6 space-y-3">
                <DaySelect
                  name="confirmationDay"
                  label="確定日"
                  isLastDay={isConfirmationLastDay}
                  onLastDayChange={(checked) =>
                    setValue("confirmationDay", checked ? 32 : 20)
                  }
                  control={control}
                  errors={errors}
                />
                <div className="space-y-2">
                  <Label>確定月（締め月からのオフセット）</Label>
                  <Controller
                    name="confirmationMonthOffset"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() ?? "0"}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger className="w-32">
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
              </div>
            )}
          </div>

          {/* ブランド */}
          <div className="space-y-2">
            <Label>ブランド（任意）</Label>
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="未選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_BRANDS.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="card-memo">メモ（任意）</Label>
            <Textarea
              id="card-memo"
              placeholder="カードに関するメモ"
              {...register("memo")}
            />
            {errors.memo && (
              <p className="text-sm text-destructive">
                {errors.memo.message}
              </p>
            )}
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
                  : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
