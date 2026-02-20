import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import Database from "better-sqlite3";
import path from "path";

const currentMonth = format(new Date(), "yyyy-MM");

// テスト前にクレカ1枚と支払い1件を用意（status=unconfirmed）
test.beforeEach(() => {
  const dbPath = path.resolve("dev.db");
  const db = new Database(dbPath);
  db.exec("DELETE FROM Payment");
  db.exec("DELETE FROM CreditCard");
  db.exec("DELETE FROM Salary");

  const now = new Date().toISOString();
  db.exec(`
    INSERT INTO CreditCard (id, name, closingDay, paymentDay, createdAt, updatedAt)
    VALUES ('card-e2e', 'テストカード', 15, 10, '${now}', '${now}')
  `);
  db.exec(`
    INSERT INTO Payment (id, creditCardId, month, amount, status, createdAt, updatedAt)
    VALUES ('pay-e2e', 'card-e2e', '${currentMonth}', 50000, 'unconfirmed', '${now}', '${now}')
  `);
  db.close();
});

test("E2E-003: 支払いステータス変更 → ダッシュボード更新確認", async ({ page }) => {
  // --- 未確定 → 確定 ---
  await page.goto("/payments");
  await expect(page.getByText("未確定", { exact: true })).toBeVisible();
  await page.getByText("未確定", { exact: true }).click();

  // 確定に変わる（「未確定」が消え「確定」が表示される）
  await expect(page.getByText("未確定", { exact: true })).toBeHidden();
  await expect(page.getByText("確定", { exact: true })).toBeVisible();

  // ダッシュボードで確認
  await page.goto("/");
  await expect(page.getByText("確定 ¥50,000")).toBeVisible();

  // --- 確定 → 支払い済み ---
  await page.goto("/payments");
  await page.getByText("確定", { exact: true }).click();

  // 支払い済みに変わる
  await expect(page.getByText("確定", { exact: true })).toBeHidden();
  await expect(page.getByText("支払い済み")).toBeVisible();

  // ダッシュボードで確認
  await page.goto("/");
  await expect(page.getByText("支払済 ¥50,000")).toBeVisible();
});
