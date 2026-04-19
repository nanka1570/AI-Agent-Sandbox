import { z } from "zod";
import { ACCOUNT_TYPES } from "@/lib/constants";

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, "口座名を入力してください")
    .max(50, "50文字以内で入力してください"),
  type: z.enum(ACCOUNT_TYPES, {
    message: "口座種別を選択してください",
  }),
  balance: z
    .number({ message: "数値を入力してください" })
    .int("整数で入力してください"),
});

export type AccountInput = z.infer<typeof accountSchema>;
