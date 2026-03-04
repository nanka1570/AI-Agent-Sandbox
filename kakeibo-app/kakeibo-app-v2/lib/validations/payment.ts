import { z } from "zod/v4";

export const paymentSchema = z.object({
  creditCardId: z.string().min(1, "カードを選択してください"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM 形式で入力してください"),
  amount: z.number().int().min(1, "1円以上で入力してください"),
  categoryId: z.string().nullable().optional(),
  memo: z
    .string()
    .max(200, "200文字以内で入力してください")
    .optional()
    .nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// フォーム用スキーマ（isRecurring チェックボックスを含む）
export const paymentFormSchema = paymentSchema.extend({
  isRecurring: z.boolean().optional().default(false),
});
export type PaymentFormInput = z.input<typeof paymentFormSchema>;

export const recurringPaymentSchema = paymentSchema.extend({
  isRecurring: z.literal(true),
});

export type RecurringPaymentInput = z.infer<typeof recurringPaymentSchema>;

export const bulkRegisterSchema = z.object({
  creditCardId: z.string().min(1, "カードを選択してください"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM 形式で入力してください"),
  totalAmount: z.number().int().min(1, "1円以上で入力してください"),
  items: z
    .array(
      z.object({
        categoryId: z.string().nullable(),
        amount: z.number().int().min(0, "0円以上で入力してください"),
      })
    )
    .min(1, "1件以上の振り分けが必要です"),
});

export type BulkRegisterInput = z.infer<typeof bulkRegisterSchema>;
