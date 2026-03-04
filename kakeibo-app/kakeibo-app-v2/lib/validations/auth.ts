import { z } from "zod/v4";

// ログインスキーマ
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: z
    .string()
    .min(6, "パスワードは6文字以上で入力してください"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 新規登録スキーマ
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email("メールアドレスの形式が正しくありません"),
    password: z
      .string()
      .min(6, "パスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// パスワードリセット要求スキーマ
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// パスワードリセット実行スキーマ
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "パスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
