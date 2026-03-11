import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-009: CSV出力ボタン動作確認", async ({ page }) => {
  // --- 支払い管理ページへ移動 ---
  await page.goto("/payments");

  // CSV出力ボタンが表示されていること
  const csvButton = page.getByText("CSV出力");
  await expect(csvButton).toBeVisible();

  // CSV出力ボタンをクリックしてダウンロードを検知
  const downloadPromise = page.waitForEvent("download");
  await csvButton.click();
  const download = await downloadPromise;

  // ファイル名にCSVが含まれていること
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
