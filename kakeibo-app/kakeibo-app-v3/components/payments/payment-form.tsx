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
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";
import { createPayment, updatePayment } from "@/lib/actions/payment-actions";

export interface PaymentItem {
  id: string;
  usageDate: Date | string;
  month: string;
  amount: number;
  status: string;
  categoryId: string;
  creditCardId: string | null;
  memo: string | null;
}

interface CardOption {
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
  categories,
  defaultUsageDate,
  open,
  onOpenChange,
  onSuccess,
}: PaymentFormProps) {
  const isEditing = !!payment;
  const [isPending, startTransition] = useTransition();

  const initialUsageDate =
    payment?.usageDate
      ? toDateString(payment.usageDate)
      : (defaultUsageDate ?? format(new Date(), "yyyy-MM-dd"));

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
      creditCardId: payment?.creditCardId ?? cards[0]?.id ?? "",
      month: payment?.month ?? initialUsageDate.slice(0, 7),
      usageDate: initialUsageDate,
      amount: payment?.amount ?? 0,
      categoryId: payment?.categoryId ?? categories[0]?.id ?? null,
      memo: payment?.memo ?? null,
    },
  });

  const watchUsageDate = watch("usageDate");

  useEffect(() => {
    if (open) {
      reset({
        creditCardId: payment?.creditCardId ?? cards[0]?.id ?? "",
        month: payment?.month ?? initialUsageDate.slice(0, 7),
        usageDate: initialUsageDate,
        amount: payment?.amount ?? 0,
        categoryId: payment?.categoryId ?? categories[0]?.id ?? null,
        memo: payment?.memo ?? null,
      });
    }
  }, [open, payment, reset, cards, categories, initialUsageDate]);

  useEffect(() => {
    if (watchUsageDate) {
      setValue("month", watchUsageDate.slice(0, 7));
    }
  }, [watchUsageDate, setValue]);

  const onSubmit = (formData: PaymentInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updatePayment(payment.id, formData)
        : await createPayment(formData);

      if (result.success) {
        toast.success(isEditing ? "支払いを更新しました" : "支払いを登録しました");
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
          <div className="space-y-2">
            <Label>利用日</Label>
            <Input
              type="date"
              {...register("usageDate")}
            />
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

          <div className="space-y-2">
            <Label>カード</Label>
            <Controller
              name="creditCardId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
