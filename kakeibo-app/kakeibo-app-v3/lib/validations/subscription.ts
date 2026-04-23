import { z } from "zod";
import { MONTH_PARAM_REGEX } from "@/lib/constants";

export const subscriptionSchema = z
  .object({
    name: z
      .string()
      .min(1, "名称を入力してください")
      .max(60, "60文字以内で入力してください"),
    amount: z.number().int().min(1, "1円以上で入力してください"),
    source: z.enum(["card", "account"]),
    creditCardId: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    categoryId: z.string().min(1, "カテゴリを選択してください"),
    dayOfMonth: z
      .number()
      .int()
      .min(1, "1日以降を指定してください")
      .max(31, "31日以下を指定してください"),
    startMonth: z
      .string()
      .regex(MONTH_PARAM_REGEX, "YYYY-MM 形式で入力してください"),
    endMonth: z
      .string()
      .regex(MONTH_PARAM_REGEX, "YYYY-MM 形式で入力してください")
      .nullable()
      .optional(),
    memo: z
      .string()
      .max(200, "200文字以内で入力してください")
      .nullable()
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.source === "card" && !val.creditCardId) {
      ctx.addIssue({
        code: "custom",
        path: ["creditCardId"],
        message: "カードを選択してください",
      });
    }
    if (val.source === "account" && !val.accountId) {
      ctx.addIssue({
        code: "custom",
        path: ["accountId"],
        message: "口座を選択してください",
      });
    }
    if (val.endMonth && val.endMonth < val.startMonth) {
      ctx.addIssue({
        code: "custom",
        path: ["endMonth"],
        message: "終了月は開始月以降にしてください",
      });
    }
  });

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
