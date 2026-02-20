import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

/**
 * 現在の認証ユーザーIDを取得する
 * 未認証の場合は /login にリダイレクトする
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}
