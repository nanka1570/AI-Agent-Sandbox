import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import Database from "better-sqlite3";
import path from "path";

// テスト前にDBを空にする
test.beforeEach(() => {
  const dbPath = path.resolve("dev.db");
  const db = new Database(dbPath);
  db.exec("DELETE FROM Payment");
  db.exec("DELETE FROM CreditCard");
  db.exec("DELETE FROM Salary");
  db.close();
});

test("E2E-001: クレカ登録 → 支払い登録 → ダッシュボード確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");

  // --- クレカ登録 ---
  await page.goto("/credit-cards");
  await page.click("text=+ 新規登録");

  // フォーム入力
  await page.fill('input[placeholder="楽天カード"]', "テストカード");
  await page.locator('input[placeholder="1〜31"]').first().fill("15");
  await page.locator('input[placeholder="1〜31"]').last().fill("10");
  await page.click("text=登録する");

  // 登録確認
  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator("text=テストカード")).toBeVisible();

  // --- 支払い登録 ---
  await page.goto("/payments");
  await page.click("text=+ 新規登録");

  // クレカ選択
  await page.locator("text=カードを選択").click();
  await page.locator('[role="option"]').filter({ hasText: "テストカード" }).click();

  // 月入力
  await page.fill('input[type="month"]', currentMonth);

  // 金額入力
  await page.fill('input[placeholder="50000"]', "50000");
  await page.click("text=登録する");

  // 登録確認（トースト表示）
  await expect(page.locator("text=登録しました")).toBeVisible();

  // ダイアログが閉じるのを待つ
  await expect(page.locator('[role="dialog"]')).toBeHidden();

  // テーブル内に登録データが表示される
  const table = page.locator("tbody");
  await expect(table.getByText("テストカード")).toBeVisible();
  await expect(table.getByText("¥50,000")).toBeVisible();
  await expect(page.getByText("未確定")).toBeVisible();

  // --- ダッシュボード確認 ---
  await page.goto("/");
  await expect(page.getByText("支払い合計")).toBeVisible();
  await expect(page.getByText("¥50,000").first()).toBeVisible();
  await expect(page.getByText("未確定 ¥50,000")).toBeVisible();
});
