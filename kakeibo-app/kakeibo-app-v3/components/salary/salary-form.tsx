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
import { LAST_DAY_CODE } from "@/lib/constants";

export interface SalaryItem {
  id: string;
  month: string;
  payDay: number;
  amount: number;
  memo: string | null;
  sortOrder: number;
}

interface SalaryFormProps {
  salary?: SalaryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: SalaryItem, isEditing: boolean) => void;
}

const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

export function SalaryForm({
  salary,
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
  const isLastDay = payDay === LAST_DAY_CODE;

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

  const onSubmit = (formData: SalaryInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateSalary(salary.id, formData)
        : await createSalary(formData);

      if (result.success) {
        toast.success(
          isEditing ? "手取りを更新しました" : "手取りを登録しました",
        );
        if (result.data) {
          const { id, month, payDay, amount, memo, sortOrder } = result.data;
          onSuccess?.(
            { id, month, payDay, amount, memo, sortOrder },
            isEditing,
          );
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
            {isEditing ? "手取りを編集" : "手取りを登録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary-month">対象月</Label>
            <Input id="salary-month" type="month" {...register("month")} />
            {errors.month && (
              <p className="text-sm text-destructive">{errors.month.message}</p>
            )}
          </div>

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
                    setValue("payDay", checked ? LAST_DAY_CODE : 25)
                  }
                />
                <Label className="text-sm font-normal">末日</Label>
              </div>
            </div>
            {errors.payDay && (
              <p className="text-sm text-destructive">{errors.payDay.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary-amount">手取り額</Label>
            <Input
              id="salary-amount"
              type="number"
              placeholder="例: 250000"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

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
