import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("空のメールアドレスでエラーになる", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === "email"
      );
      expect(emailError?.message).toBe("メールアドレスを入力してください");
    }
  });

  it("不正なメールアドレス形式でエラーになる", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === "email"
      );
      expect(emailError?.message).toBe(
        "メールアドレスの形式が正しくありません"
      );
    }
  });

  it("6文字未満のパスワードでエラーになる", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(
        (issue) => issue.path[0] === "password"
      );
      expect(pwError?.message).toBe("パスワードは6文字以上で入力してください");
    }
  });
});

describe("registerSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("パスワード不一致でエラーになる", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path.includes("confirmPassword")
      );
      expect(confirmError?.message).toBe("パスワードが一致しません");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("空のメールアドレスでエラーになる", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === "email"
      );
      expect(emailError?.message).toBe("メールアドレスを入力してください");
    }
  });
});

describe("resetPasswordSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("パスワード不一致でエラーになる", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path.includes("confirmPassword")
      );
      expect(confirmError?.message).toBe("パスワードが一致しません");
    }
  });
});
