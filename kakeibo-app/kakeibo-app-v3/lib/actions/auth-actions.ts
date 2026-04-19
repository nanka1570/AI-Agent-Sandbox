"use server";

import { headers } from "next/headers";
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

  if (shouldRedirect) {
    redirect("/");
  }

  return { success: true };
}

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
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: "アカウント登録に失敗しました" };
  }
}

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

  // メールアドレスの存在有無を結果から判別できないよう、常に success を返す
  // (Supabase 側のエラーはサーバーログにのみ残す)
  try {
    const headerList = await headers();
    const origin = headerList.get("origin") ?? headerList.get("host");
    const baseUrl = origin?.startsWith("http") ? origin : `https://${origin}`;
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
    });
  } catch {
    // 送信系エラーは UI に露出させない
  }

  return { success: true };
}

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
