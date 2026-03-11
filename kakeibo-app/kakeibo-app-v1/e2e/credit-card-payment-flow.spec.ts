import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import { loginAsTestUser } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
});

test("E2E-001: クレカ登録 → 支払い登録 → ダッシュボード確認", async ({ page }) => {
  const currentMonth = format(new Date(), "yyyy-MM");
  // ユニークなカード名（前回テスト実行データとの競合回避）
  const cardName = `E2Eカード${Date.now()}`;

  // --- クレカ登録 ---
  // paymentDay=27: 給料日(25日)以降にすることで、給料サイクルモードでも当月に表示される
  // paymentMonthOffset=0(当月払い): フォームのデフォルト値
  await page.goto("/credit-cards");
  await page.click("text=+ 新規登録");

  await page.fill('input[placeholder="楽天カード"]', cardName);
  await page.locator('input[placeholder="1〜31"]').first().fill("15");
  await page.locator('input[placeholder="1〜31"]').last().fill("27");
  await page.click("text=登録する");

  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.getByText(cardName).first()).toBeVisible();

  // --- 支払い登録（当月の締め月 + offset=0 → 当月27日引き落とし） ---
  await page.goto("/payments");
  await page.click("text=+ 新規登録");

  // クレカ選択
  await page.locator("text=カードを選択").click();
  await page.locator('[role="option"]').filter({ hasText: cardName }).first().click();

  // 締め月・金額入力
  await page.fill('input[type="month"]', currentMonth);
  await page.fill('input[placeholder="50000"]', "30000");
  await page.click("text=登録する");

  await expect(page.locator("text=登録しました")).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toBeHidden();

  // 当月の支払い一覧を確認
  await page.goto(`/payments?month=${currentMonth}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("tbody").getByText(cardName).first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator("tbody").getByText("¥30,000").first()).toBeVisible({ timeout: 10000 });

  // --- ダッシュボード確認 ---
  await page.goto("/");
  await expect(page.getByText("支払い合計")).toBeVisible();
});
