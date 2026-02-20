"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { ActionResult } from "@/types";

/**
 * メールアドレス + パスワードでログインする
 */
export async function login(
  email: string,
  password: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * メールアドレス + パスワードで新規登録する
 */
export async function register(
  email: string,
  password: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * ログアウトする
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * パスワードリセットメールを送信する
 */
export async function resetPassword(
  email: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
