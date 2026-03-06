import { test } from "@playwright/test";

test("Aurora Finance - ローカルスクリーンショット取得", async ({ browser }) => {
  test.setTimeout(120000);

  const context = await browser.newContext();
  const page = await context.newPage();
  const dir = "__tests__/e2e/screenshots/aurora";

  // 1. ログインページ
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/01-login.png`, fullPage: true });

  // 2. 新規登録ページ
  await page.goto("/register", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/02-register.png`, fullPage: true });

  // 3. パスワードリセットページ
  await page.goto("/forgot-password", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/03-forgot-password.png`, fullPage: true });

  // 4. 新規登録フロー
  await page.goto("/register", { waitUntil: "networkidle" });
  const testEmail = `aurora-${Date.now()}@example.com`;
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="password"]', "TestPass123!");
  await page.fill('input[id="confirmPassword"]', "TestPass123!");
  await page.screenshot({ path: `${dir}/04-register-filled.png`, fullPage: true });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${dir}/05-after-register.png`, fullPage: true });
  console.log("05-after-register: URL =", page.url());

  // 5. ログイン（登録後自動リダイレクト or 手動ログイン）
  if (page.url().includes("/login") || page.url().includes("/register")) {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', "TestPass123!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
  }

  const currentUrl = page.url();
  console.log("After login: URL =", currentUrl);

  // 6. 認証後のページ
  if (!currentUrl.includes("/login") && !currentUrl.includes("/register")) {
    // ダッシュボード（PC）
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/06-dashboard-pc.png`, fullPage: true });

    // ダッシュボード（モバイル）
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/07-dashboard-mobile.png`, fullPage: true });

    // 手取り管理（PC）
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/salary", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/08-salary.png`, fullPage: true });

    // クレカ管理
    await page.goto("/credit-cards", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/09-credit-cards.png`, fullPage: true });

    // 支払い管理
    await page.goto("/payments", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/10-payments.png`, fullPage: true });

    // カテゴリ
    await page.goto("/budget", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/11-budget.png`, fullPage: true });
  } else {
    console.log("ログイン失敗。URL:", currentUrl);
  }

  await context.close();
});
