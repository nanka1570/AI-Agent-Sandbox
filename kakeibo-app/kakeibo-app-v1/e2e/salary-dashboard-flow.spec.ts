import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-002: 給料登録 → ダッシュボード確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");

  // --- 給料登録 ---
  await page.goto("/salary");
  await page.click("text=+ 新規登録");

  await page.fill('input[type="month"]', currentMonth);
  await page.fill('input[placeholder="1〜31"]', "25");
  await page.fill('input[placeholder="250000"]', "250000");
  await page.click("text=登録する");

  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator("text=¥250,000").first()).toBeVisible();

  // --- ダッシュボード確認 ---
  await page.goto("/");
  await expect(page.getByText("給料合計")).toBeVisible();
});
