import { z } from "zod";

// Server Actions の共通戻り値型
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// クレジットカード
export const creditCardSchema = z.object({
  name: z.string().min(1, "カード名は必須です").max(50, "カード名は50文字以内です"),
  closingDay: z
    .number()
    .int("整数で入力してください")
    .min(1, "1〜31の範囲で入力してください")
    .max(31, "1〜31の範囲で入力してください"),
  paymentDay: z
    .number()
    .int("整数で入力してください")
    .min(1, "1〜31の範囲で入力してください")
    .max(31, "1〜31の範囲で入力してください"),
  memo: z.string().optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;
