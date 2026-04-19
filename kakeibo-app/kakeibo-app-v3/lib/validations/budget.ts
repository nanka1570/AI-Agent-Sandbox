import { z } from "zod";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "カテゴリを選択してください"),
  month: z.string().regex(MONTH_PARAM_REGEX, "有効な月を入力してください"),
  amount: z.number().int().min(1, "1円以上を入力してください"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
