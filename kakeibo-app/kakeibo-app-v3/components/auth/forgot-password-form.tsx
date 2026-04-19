"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/actions/auth-actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    const result = await forgotPassword(data);

    if (result.success) {
      setIsSuccess(true);
      toast.success("受付しました");
    } else {
      setServerError(result.error);
      toast.error(result.error);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-primary/10 p-4 text-center text-sm">
          入力いただいたメールアドレスが登録済みであれば、パスワードリセット用のメールをお送りしました。メール内のリンクからパスワードを再設定してください。
        </div>
        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            ログインページへ戻る
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

      <p className="text-sm text-muted-foreground">
        登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
      </p>

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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "リセットメールを送信"}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </form>
  );
}
