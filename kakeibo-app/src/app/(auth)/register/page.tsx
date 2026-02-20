"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // パスワード不一致チェック
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    // パスワード最低6文字（Supabase デフォルト）
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(email, password);
      if (!result.success) {
        setError(result.error);
      } else {
        setEmailSent(true);
      }
    } catch {
      // redirect は例外をthrowするため、Next.js が自動的に処理する
    } finally {
      setIsLoading(false);
    }
  }

  // メール送信完了画面
  if (emailSent) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="inline-block border-2 border-border bg-primary px-6 py-3 text-2xl font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            家計簿 APP
          </h1>
        </div>
        <div className="space-y-4 border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
            <p className="text-lg font-black text-emerald-800">
              確認メールを送信しました
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-700">
              {email}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            メール内の「メールアドレスを確認する」リンクをクリックすると、ログインできるようになります。
          </p>
          <p className="text-xs text-muted-foreground">
            メールが届かない場合は迷惑メールフォルダをご確認ください。
          </p>
          <Link
            href="/login"
            className="block w-full border-2 border-border bg-primary py-2 text-center text-sm font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            ログイン画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <h1 className="inline-block border-2 border-border bg-primary px-6 py-3 text-2xl font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          家計簿 APP
        </h1>
        <p className="mt-4 text-sm font-bold text-muted-foreground">
          新規アカウントを作成
        </p>
      </div>

      {/* 登録フォーム */}
      <form
        onSubmit={(e) => handleSubmit(e)}
        className="space-y-5 border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {/* エラー表示 */}
        {error && (
          <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}

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

        {/* パスワード */}
        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold">
            パスワード
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        {/* パスワード確認 */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-bold">
            パスワード（確認）
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="もう一度入力"
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        {/* 登録ボタン */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "登録中..." : "アカウントを作成"}
        </Button>

        {/* リンク */}
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            ログインはこちら
          </Link>
        </div>
      </form>
    </div>
  );
}
