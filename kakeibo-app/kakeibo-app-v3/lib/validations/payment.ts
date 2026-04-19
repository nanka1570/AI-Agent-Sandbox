import { z } from "zod";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const paymentSchema = z.object({
  creditCardId: z.string().min(1, "カードを選択してください"),
  month: z
    .string()
    .regex(MONTH_PARAM_REGEX, "YYYY-MM 形式で入力してください"),
  usageDate: z
    .string()
    .regex(DATE_REGEX, "YYYY-MM-DD 形式で入力してください")
    .nullable()
    .optional(),
  amount: z.number().int().min(1, "1円以上で入力してください"),
  categoryId: z.string().nullable().optional(),
  memo: z
    .string()
    .max(200, "200文字以内で入力してください")
    .nullable()
    .optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const csvImportSchema = z.object({
  creditCardId: z.string().min(1, "カードを選択してください"),
  items: z
    .array(
      z.object({
        usageDate: z.string().regex(DATE_REGEX, "日付形式エラー"),
        amount: z.number().int().min(1),
        memo: z.string().nullable().optional(),
        categoryId: z.string().nullable().optional(),
      }),
    )
    .min(1, "1件以上の明細が必要です"),
});

export type CsvImportInput = z.infer<typeof csvImportSchema>;
