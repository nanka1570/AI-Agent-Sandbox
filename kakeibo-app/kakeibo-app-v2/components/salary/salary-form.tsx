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
import { salarySchema, type SalaryInput } from "@/lib/validations/salary";
import { createSalary, updateSalary } from "@/lib/actions/salary-actions";
import { formatCurrency } from "@/lib/utils/format";

interface SalaryItem {
  id: string;
  month: string;
  payDay: number;
  amount: number;
  memo: string | null;
  sortOrder: number;
}

interface SalaryFormProps {
  /** 編集対象の手取り（新規作成時は undefined） */
  salary?: {
    id: string;
    month: string;
    payDay: number;
    amount: number;
    memo: string | null;
  };
  /** 金額プリセット候補 */
  recentAmounts: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 作成・更新成功時のコールバック */
  onSuccess?: (data: SalaryItem, isEditing: boolean) => void;
}

/** 1〜31の数値配列を生成する */
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

export function SalaryForm({
  salary,
  recentAmounts,
  open,
  onOpenChange,
  onSuccess,
}: SalaryFormProps) {
  const isEditing = !!salary;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalaryInput>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      month: salary?.month ?? "",
      payDay: salary?.payDay ?? 25,
      amount: salary?.amount ?? 0,
      memo: salary?.memo ?? null,
    },
  });

  const payDay = watch("payDay");
  const isLastDay = payDay === 32;

  // ダイアログが開くたびにフォームをリセット
  useEffect(() => {
    if (open) {
      reset({
        month: salary?.month ?? "",
        payDay: salary?.payDay ?? 25,
        amount: salary?.amount ?? 0,
        memo: salary?.memo ?? null,
      });
    }
  }, [open, salary, reset]);

  /** フォーム送信処理（Optimistic UI: ダイアログ即閉じ） */
  const onSubmit = (formData: SalaryInput) => {
    reset();
    onOpenChange(false);
    toast.success(isEditing ? "手取りを更新しました" : "手取りを登録しました");

    startTransition(async () => {
      const result = isEditing
        ? await updateSalary(salary.id, formData)
        : await createSalary(formData);

      if (result.success) {
        if (result.data) {
          onSuccess?.(result.data as SalaryItem, isEditing);
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  /** プリセット金額をクリックして入力欄にセットする */
  const handlePresetClick = (amount: number) => {
    setValue("amount", amount, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "手取りを編集" : "手取りを登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 対象月 */}
          <div className="space-y-2">
            <Label htmlFor="salary-month">対象月</Label>
            <Input id="salary-month" type="month" {...register("month")} />
            {errors.month && (
              <p className="text-sm text-destructive">{errors.month.message}</p>
            )}
          </div>

          {/* 支給日 */}
          <div className="space-y-2">
            <Label>支給日</Label>
            <div className="flex items-center gap-3">
              <Controller
                name="payDay"
                control={control}
                render={({ field }) => (
                  <Select
                    value={isLastDay ? "" : (field.value?.toString() ?? "")}
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
                  onCheckedChange={(checked) =>
                    setValue("payDay", checked ? 32 : 25)
                  }
                />
                <Label className="text-sm font-normal">末日</Label>
              </div>
            </div>
            {errors.payDay && (
              <p className="text-sm text-destructive">{errors.payDay.message}</p>
            )}
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="salary-amount">手取り額</Label>
            <Input
              id="salary-amount"
              type="number"
              placeholder="例: 250000"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {/* 金額プリセット */}
            {recentAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recentAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(amount)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="salary-memo">メモ（任意）</Label>
            <Textarea
              id="salary-memo"
              placeholder="メモを入力"
              {...register("memo")}
            />
            {errors.memo && (
              <p className="text-sm text-destructive">{errors.memo.message}</p>
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
              {isSubmitting || isPending ? "保存中..." : isEditing ? "更新" : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
