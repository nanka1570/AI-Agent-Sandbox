import { type Page } from "@playwright/test";

/**
 * テスト用ユーザーでログインする
 * .env.local の TEST_USER_EMAIL / TEST_USER_PASSWORD を使用
 */
export async function loginAsTestUser(page: Page) {
  const email = process.env.TEST_USER_EMAIL || "e2e-test@kakeibo-app.test";
  const password = process.env.TEST_USER_PASSWORD || "e2eTestPass123";

  await page.goto("/login");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');

  // ダッシュボードにリダイレクトされるのを待つ
  await page.waitForURL("/", { timeout: 10000 });
}
