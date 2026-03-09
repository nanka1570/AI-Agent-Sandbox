import { z } from "zod/v4";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

export const salarySchema = z.object({
  month: z.string().regex(MONTH_PARAM_REGEX, "YYYY-MM 形式で入力してください"),
  payDay: z.number().int().min(1).max(32, "1〜31または末日を選択してください"),
  amount: z.number().int().min(1, "1円以上で入力してください"),
  memo: z.string().max(200, "200文字以内で入力してください").optional().nullable(),
});

export type SalaryInput = z.infer<typeof salarySchema>;
