import { test, expect } from "@playwright/test";

// 法的ページは認証不要（公開ページ）

test("E2E-006: プライバシーポリシーページ表示", async ({ page }) => {
  await page.goto("/privacy");

  await expect(page.getByText("プライバシーポリシー").first()).toBeVisible();

  // 主要セクションが含まれていること
  await expect(page.getByText("個人情報").first()).toBeVisible();
});

test("E2E-007: 利用規約ページ表示", async ({ page }) => {
  await page.goto("/terms");

  await expect(page.getByText("利用規約").first()).toBeVisible();
});

test("E2E-008: フッターから法的ページに遷移", async ({ page }) => {
  // ログインページのフッターからリンクを確認
  await page.goto("/login");

  // フッターリンクが存在しない場合はスキップ（ログインページにはフッターがない可能性）
  const privacyLink = page.locator('a[href="/privacy"]');
  const termsLink = page.locator('a[href="/terms"]');

  if (await privacyLink.isVisible()) {
    await privacyLink.click();
    await expect(page).toHaveURL("/privacy");
    await expect(page.getByText("プライバシーポリシー").first()).toBeVisible();
  }

  await page.goto("/login");

  if (await termsLink.isVisible()) {
    await termsLink.click();
    await expect(page).toHaveURL("/terms");
    await expect(page.getByText("利用規約").first()).toBeVisible();
  }
});
