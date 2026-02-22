"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrencyJP } from "@/lib/utils";
import { AmountPresets } from "@/components/amount-presets";
import type { CreditCard, Category } from "@/generated/prisma/client";
import { paymentSchema, type PaymentInput } from "@/types";
import { createPayment } from "@/lib/actions/payment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCards: CreditCard[];
  categories: Category[];
};

export function QuickInputDialog({
  open,
  onOpenChange,
  creditCards,
  categories,
}: Props) {
  const currentMonth = format(new Date(), "yyyy-MM");
  // 「雑費」カテゴリをデフォルトに
  const iroiroId = categories.find((c) => c.name === "雑費")?.id ?? "";

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      creditCardId: "",
      categoryId: iroiroId,
      month: currentMonth,
      amount: undefined,
      memo: "",
      isRecurring: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: PaymentInput) {
    const result = await createPayment(values);
    if (result.success) {
      toast("登録しました");
      // カード・カテゴリ・月・繰り返しを保持し、金額とメモのみリセット
      form.reset({
        creditCardId: values.creditCardId,
        categoryId: values.categoryId,
        month: values.month,
        amount: undefined,
        memo: "",
        isRecurring: values.isRecurring,
      });
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>クイック入力</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* 金額 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金額（円） *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="50000"
                      className="[&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : parseInt(val, 10));
                      }}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                      }}
                    />
                  </FormControl>
                  <AmountPresets
                    storageKey="kakeibo-presets-payment"
                    defaults={[5000, 10000, 30000, 50000, 100000]}
                    onSelect={(v) => field.onChange(v)}
                  />
                  {field.value ? (
                    <FormDescription className="font-bold text-foreground">
                      = {formatCurrencyJP(field.value)}
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* カテゴリ */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリ</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="border-2 border-border bg-white">
                        <SelectValue placeholder="カテゴリを選択（任意）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    カテゴリの追加・編集は「予算」タブから行えます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* クレジットカード */}
            <FormField
              control={form.control}
              name="creditCardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>クレジットカード *</FormLabel>
                  {creditCards.length === 0 ? (
                    <p className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-md px-3 py-2">
                      先にカードを登録してください
                    </p>
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-border bg-white">
                          <SelectValue placeholder="カードを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタン */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                登録する
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
