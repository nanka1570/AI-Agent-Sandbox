import { test, expect } from "@playwright/test";

test.describe("未認証時のルーティング", () => {
  test("ルートアクセスはログイン画面にリダイレクトされる", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });

  test("登録画面のフォーム要素が表示される", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
    await expect(page.getByLabel("パスワード（確認）")).toBeVisible();
  });

  test("パスワード再設定画面のフォーム要素が表示される", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });
});

test.describe("公開画面の基本動作", () => {
  test("ログイン画面のフォーム要素", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("ログイン → 新規登録 → ログインに戻る動線", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /新規登録/ }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("button", { name: /登録/ })).toBeVisible();
  });
});
