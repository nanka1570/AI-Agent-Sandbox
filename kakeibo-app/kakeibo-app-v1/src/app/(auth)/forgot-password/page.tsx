"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setIsSent(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <h1 className="inline-block border-2 border-border bg-primary px-6 py-3 text-2xl font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          家計簿 APP
        </h1>
        <p className="mt-4 text-sm font-bold text-muted-foreground">
          パスワードをリセット
        </p>
      </div>

      <div className="space-y-5 border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {isSent ? (
          /* 送信完了メッセージ */
          <div className="space-y-4 text-center">
            <div className="border-2 border-emerald-600 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              リセット用のメールを送信しました。メールをご確認ください。
            </div>
            <Link
              href="/login"
              className="inline-block font-bold text-primary underline-offset-4 hover:underline"
            >
              ログインに戻る
            </Link>
          </div>
        ) : (
          /* リセットフォーム */
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
            {/* エラー表示 */}
            {error && (
              <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
            </p>

            {/* メールアドレス */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* 送信ボタン */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "送信中..." : "リセットメールを送信"}
            </Button>

            {/* リンク */}
            <div className="text-center text-sm">
              <Link
                href="/login"
                className="font-bold text-primary underline-offset-4 hover:underline"
              >
                ログインに戻る
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
