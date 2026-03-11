import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-005: レポートページ表示 → 年セレクター動作", async ({ page }) => {
  // --- レポートページへ移動 ---
  await page.goto("/reports");

  // ページタイトルが表示されること
  await expect(page.getByRole("heading", { name: "レポート" })).toBeVisible();

  // 年間サマリーカードが表示されること
  await expect(page.getByText("年間収入").first()).toBeVisible();
  await expect(page.getByText("年間支出").first()).toBeVisible();
  await expect(page.getByText("年間収支").first()).toBeVisible();

  // 月次詳細セクションが表示されること
  await expect(page.getByText("月次詳細").first()).toBeVisible();

  // --- 年セレクターの動作確認 ---
  const yearSelector = page.locator("[role='combobox']").first();
  await expect(yearSelector).toBeVisible();

  // 現在の年が選択されていることを確認
  const currentYear = new Date().getFullYear().toString();
  await expect(yearSelector).toContainText(currentYear);
});
