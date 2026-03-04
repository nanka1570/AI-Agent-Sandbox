import { z } from "zod/v4";

export const creditCardSchema = z.object({
  name: z
    .string()
    .min(1, "カード名を入力してください")
    .max(50, "50文字以内で入力してください"),
  closingDay: z
    .number()
    .int()
    .min(1)
    .max(32, "1〜31または末日を選択してください"),
  paymentDay: z
    .number()
    .int()
    .min(1)
    .max(32, "1〜31または末日を選択してください"),
  paymentMonthOffset: z
    .number()
    .int()
    .min(0)
    .max(2, "0〜2の範囲で入力してください"),
  confirmationDay: z.number().int().min(1).max(32).nullable().optional(),
  confirmationMonthOffset: z.number().int().min(0).nullable().optional(),
  brand: z.string().nullable().optional(),
  memo: z
    .string()
    .max(200, "200文字以内で入力してください")
    .nullable()
    .optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;
