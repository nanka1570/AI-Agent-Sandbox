import { z } from "zod";

// Server Actions の共通戻り値型
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// preprocess で空文字列・null・undefined を数値に変換するヘルパー
const numericPreprocess = (v: unknown) =>
  v === "" || v == null ? undefined : Number(v);

// クレジットカード
export const creditCardSchema = z.object({
  name: z.string().min(1, "カード名は必須です").max(50, "カード名は50文字以内です"),
  closingDay: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1〜31の範囲で入力してください" })
      .int("整数で入力してください")
      .min(1, "1〜31の範囲で入力してください")
      .max(31, "1〜31の範囲で入力してください"),
  ),
  paymentDay: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1〜31の範囲で入力してください" })
      .int("整数で入力してください")
      .min(1, "1〜31の範囲で入力してください")
      .max(31, "1〜31の範囲で入力してください"),
  ),
  paymentMonthOffset: z
    .number()
    .int()
    .min(0, "0〜2の範囲で選択してください")
    .max(2, "0〜2の範囲で選択してください"),
  brand: z.string().optional(),
  memo: z.string().optional(),
});

// z.preprocess は入力型が unknown になるため、出力型を明示的に定義
export type CreditCardInput = {
  name: string;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  brand?: string;
  memo?: string;
};

// 給料
export const salarySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で入力してください"),
  payDay: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1〜31の範囲で入力してください" })
      .int("整数で入力してください")
      .min(1, "1〜31の範囲で入力してください")
      .max(31, "1〜31の範囲で入力してください"),
  ),
  amount: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1円以上で入力してください" })
      .int("整数で入力してください")
      .min(1, "1円以上で入力してください"),
  ),
  memo: z.string().optional(),
});

export type SalaryInput = {
  month: string;
  payDay: number;
  amount: number;
  memo?: string;
};

// 支払い
export const paymentSchema = z.object({
  creditCardId: z.string().min(1, "クレジットカードを選択してください"),
  categoryId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で入力してください"),
  amount: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1円以上で入力してください" })
      .int("整数で入力してください")
      .min(1, "1円以上で入力してください"),
  ),
  memo: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

export type PaymentInput = {
  creditCardId: string;
  categoryId?: string;
  month: string;
  amount: number;
  memo?: string;
  isRecurring?: boolean;
};

export const paymentStatusSchema = z.enum(["unconfirmed", "confirmed", "paid"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// カテゴリ
export const categorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").max(30, "カテゴリ名は30文字以内です"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "正しい色コードを入力してください"),
  sortOrder: z.number().int().min(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// 予算
export const budgetSchema = z.object({
  categoryId: z.string().min(1, "カテゴリを選択してください"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で入力してください"),
  amount: z.preprocess(
    numericPreprocess,
    z
      .number({ message: "1円以上で入力してください" })
      .int("整数で入力してください")
      .min(1, "1円以上で入力してください"),
  ),
});

export type BudgetInput = {
  categoryId: string;
  month: string;
  amount: number;
};
