import { z } from "zod";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

export const statementSchema = z.object({
  creditCardId: z.string().min(1),
  month: z.string().regex(MONTH_PARAM_REGEX, "YYYY-MM 形式で入力してください"),
  confirmedAmount: z
    .number()
    .int()
    .min(0, "0円以上で入力してください"),
  memo: z.string().max(200).nullable().optional(),
});

export type StatementInput = z.infer<typeof statementSchema>;

export const statementWithdrawSchema = z.object({
  withdrawnAmount: z
    .number()
    .int()
    .min(1, "引落額は1円以上を指定してください"),
  accountId: z.string().min(1, "引落口座を選択してください"),
});

export type StatementWithdrawInput = z.infer<typeof statementWithdrawSchema>;
