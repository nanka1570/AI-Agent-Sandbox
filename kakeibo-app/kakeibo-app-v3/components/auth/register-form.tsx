"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerAction } from "@/lib/actions/auth-actions";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await registerAction(data);

    if (result.success) {
      setIsSuccess(true);
      toast.success("登録を受け付けました");
    } else {
      setServerError(result.error);
      toast.error(result.error);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-primary/10 p-4 text-center text-sm">
          登録を受け付けました。確認メールが届いた場合は、メール内のリンクを開いてアカウントを有効化してください。
        </div>
        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            ログインページへ進む
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="mail@example.com"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          type="password"
          placeholder="6文字以上"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="もう一度入力してください"
          autoComplete="new-password"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "登録中..." : "新規登録"}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </form>
  );
}
