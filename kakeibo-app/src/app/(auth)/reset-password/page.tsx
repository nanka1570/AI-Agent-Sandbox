"use client";

import { useState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      // redirect は例外をthrowするため、Next.js が自動的に処理する
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
          新しいパスワードを設定
        </p>
      </div>

      {/* パスワード変更フォーム */}
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

        {/* 新しいパスワード */}
        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold">
            新しいパスワード
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

        {/* 変更ボタン */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "変更中..." : "パスワードを変更する"}
        </Button>
      </form>
    </div>
  );
}
