"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      // redirect が成功した場合、ここには到達しない
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      // redirect は例外をthrowするため、ここでキャッチされる場合がある
      // Next.js が自動的にリダイレクトを処理するため何もしない
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
          ログインしてください
        </p>
      </div>

      {/* ログインフォーム */}
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
            placeholder="パスワードを入力"
            required
            disabled={isLoading}
          />
        </div>

        {/* ログインボタン */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "ログイン中..." : "ログイン"}
        </Button>

        {/* リンク */}
        <div className="flex flex-col items-center gap-2 text-sm">
          <Link
            href="/forgot-password"
            className="font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            パスワードを忘れた方
          </Link>
          <Link
            href="/register"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            アカウントを作成
          </Link>
        </div>
      </form>
    </div>
  );
}
