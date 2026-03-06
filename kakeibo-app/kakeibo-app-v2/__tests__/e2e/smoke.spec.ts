import { test, expect } from "@playwright/test";

test("ログインページが表示される", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/家計簿/);
});

test("未認証ユーザーはログインにリダイレクトされる", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
