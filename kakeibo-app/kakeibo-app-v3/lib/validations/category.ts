import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリ名を入力してください")
    .max(30, "30文字以内で入力してください"),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "有効なカラーコード（例: #FF6384）を入力してください",
    ),
});

export type CategoryInput = z.infer<typeof categorySchema>;
