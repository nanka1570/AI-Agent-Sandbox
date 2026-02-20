import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import Database from "better-sqlite3";
import path from "path";

test.beforeEach(() => {
  const dbPath = path.resolve("dev.db");
  const db = new Database(dbPath);
  db.exec("DELETE FROM Payment");
  db.exec("DELETE FROM CreditCard");
  db.exec("DELETE FROM Salary");
  db.close();
});

test("E2E-002: 給料登録 → ダッシュボード確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");

  // --- 給料登録 ---
  await page.goto("/salary");
  await page.click("text=+ 新規登録");

  // フォーム入力
  await page.fill('input[type="month"]', currentMonth);
  await page.fill('input[placeholder="1〜31"]', "25");
  await page.fill('input[placeholder="250000"]', "250000");
  await page.click("text=登録する");

  // 登録確認
  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator("text=¥250,000")).toBeVisible();

  // --- ダッシュボード確認 ---
  await page.goto("/");
  await expect(page.locator("text=給料合計")).toBeVisible();
  await expect(page.locator("text=¥250,000").first()).toBeVisible();

  // 支払いなしなので残額も¥250,000
  await expect(page.getByText("残額", { exact: true })).toBeVisible();
});
