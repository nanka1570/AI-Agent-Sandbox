import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-003: 支払いステータス変更確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");

  // --- 準備: クレカ登録 ---
  await page.goto("/credit-cards");
  await page.click("text=+ 新規登録");
  await page.fill('input[placeholder="楽天カード"]', "ステータス確認用");
  await page.locator('input[placeholder="1〜31"]').first().fill("20");
  await page.locator('input[placeholder="1〜31"]').last().fill("5");
  await page.click("text=登録する");
  await expect(page.locator("text=登録しました")).toBeVisible();

  // --- 準備: 支払い登録 ---
  await page.goto("/payments");
  await page.click("text=+ 新規登録");
  await page.locator("text=カードを選択").click();
  await page.locator('[role="option"]').filter({ hasText: "ステータス確認用" }).first().click();
  await page.fill('input[type="month"]', currentMonth);
  await page.fill('input[placeholder="50000"]', "40000");
  await page.click("text=登録する");
  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toBeHidden();

  // --- 未確定 → 確定 ---
  const row = page.locator("tbody tr").filter({ hasText: "ステータス確認用" }).first();
  const statusButton = row.getByRole("button", { name: "未確定" });
  await expect(statusButton).toBeVisible();
  await statusButton.click();

  // 確定に変わる
  await expect(row.getByRole("button", { name: "確定" })).toBeVisible();

  // --- 確定 → 支払い済み ---
  await row.getByRole("button", { name: "確定" }).click();
  await expect(row.getByText("支払い済み")).toBeVisible();
});
