import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-001: クレカ登録 → 支払い登録 → ダッシュボード確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");

  // --- クレカ登録 ---
  await page.goto("/credit-cards");
  await page.click("text=+ 新規登録");

  await page.fill('input[placeholder="楽天カード"]', "E2Eカード001");
  await page.locator('input[placeholder="1〜31"]').first().fill("15");
  await page.locator('input[placeholder="1〜31"]').last().fill("10");
  await page.click("text=登録する");

  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator("text=E2Eカード001").first()).toBeVisible();

  // --- 支払い登録 ---
  await page.goto("/payments");
  await page.click("text=+ 新規登録");

  // クレカ選択
  await page.locator("text=カードを選択").click();
  await page.locator('[role="option"]').filter({ hasText: "E2Eカード001" }).first().click();

  // 月・金額入力
  await page.fill('input[type="month"]', currentMonth);
  await page.fill('input[placeholder="50000"]', "30000");
  await page.click("text=登録する");

  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toBeHidden();

  // テーブルに登録データが表示される
  await expect(page.locator("tbody").getByText("E2Eカード001").first()).toBeVisible();
  await expect(page.locator("tbody").getByText("¥30,000").first()).toBeVisible();

  // --- ダッシュボード確認 ---
  await page.goto("/");
  await expect(page.getByText("支払い合計")).toBeVisible();
});
