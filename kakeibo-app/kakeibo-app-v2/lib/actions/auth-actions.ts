"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/utils/auth-errors";
import type { ActionResult } from "@/lib/types";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

// ログイン
export async function login(data: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerClient();
  let shouldRedirect = false;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }

    shouldRedirect = true;
  } catch {
    return { success: false, error: "ログインに失敗しました" };
  }

  // redirect は try の外で呼ぶ（Next.js の redirect は内部で例外をスローするため）
  if (shouldRedirect) {
    redirect("/");
  }

  return { success: true };
}

// 新規登録
export async function register(data: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerClient();

  try {
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      console.error("[register] Supabase error:", error.message);
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  } catch (e) {
    console.error("[register] unexpected error:", e);
    return { success: false, error: "アカウント登録に失敗しました" };
  }
}

// ログアウト
export async function logout(): Promise<ActionResult> {
  const supabase = await createServerClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }
  } catch {
    return { success: false, error: "ログアウトに失敗しました" };
  }

  redirect("/login");
}

// パスワードリセット要求
export async function forgotPassword(data: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: "パスワードリセットメールの送信に失敗しました" };
  }
}

// パスワードリセット実行
export async function resetPassword(data: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: "パスワードの更新に失敗しました" };
  }
}
