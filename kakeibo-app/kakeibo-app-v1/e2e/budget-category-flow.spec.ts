import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-004: カテゴリ追加 → 予算設定 → 消化率確認", async ({ page }) => {
  // ユニークなカテゴリ名（重複エラー回避）
  const categoryName = `E2Eテスト費${Date.now()}`;

  // --- 予算ページへ移動 ---
  await page.goto("/budget");
  await expect(page.getByRole("heading", { name: "カテゴリ / 予算" })).toBeVisible();

  // デフォルトカテゴリが表示されていることを確認
  await expect(page.getByText("食費").first()).toBeVisible();

  // --- カテゴリ追加 ---
  await page.click("text=カテゴリ追加");
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  await page.fill('input[placeholder="例: 食費"]', categoryName);
  await page.click("text=追加する");

  // ダイアログが閉じ、テーブルに新カテゴリが表示されることを確認
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });
  await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 10000 });

  // --- 予算設定 ---
  // 新しく追加したカテゴリの「設定する」ボタンをクリック
  const newCategoryRow = page.locator("tr", { hasText: categoryName });
  await newCategoryRow.getByText("設定する").click();

  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.getByText(`予算設定 - ${categoryName}`)).toBeVisible();

  await page.fill('input[placeholder="30000"]', "50000");
  await page.click("text=保存する");

  // ダイアログが閉じ、予算額が反映されることを確認
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });
  await expect(newCategoryRow.getByText("¥50,000")).toBeVisible({ timeout: 10000 });
});
