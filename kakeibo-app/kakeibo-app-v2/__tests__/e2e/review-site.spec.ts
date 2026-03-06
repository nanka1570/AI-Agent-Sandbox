import { test } from "@playwright/test";

const BASE_URL = "https://kakeibo-app-v2.vercel.app";

test.use({
  baseURL: BASE_URL,
});

test("サイト全体レビュー - スクリーンショット取得", async ({ browser }) => {
  test.setTimeout(120000);

  // 新しいコンテキストを作成（クリーンな状態）
  const context = await browser.newContext();
  const page = await context.newPage();

  const dir = "__tests__/e2e/screenshots";

  // 1. ログインページ
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/01-login.png`, fullPage: true });
  console.log("01-login: URL =", page.url());

  // 2. 新規登録ページ
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/02-register.png`, fullPage: true });

  // 3. パスワードリセットページ
  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/03-forgot-password.png`, fullPage: true });

  // 4. 新規登録 → ログインフロー
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  const testEmail = `review-${Date.now()}@example.com`;
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="password"]', "TestPass123!");
  await page.fill('input[id="confirmPassword"]', "TestPass123!");
  await page.screenshot({ path: `${dir}/04-register-filled.png`, fullPage: true });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${dir}/05-register-result.png`, fullPage: true });
  console.log("05-register-result: URL =", page.url());

  // 5. ログイン（confirm email OFF なので直接ログイン可能なはず）
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${dir}/06-login-page.png`, fullPage: true });
  console.log("06-login-page: URL =", page.url());

  // ログインページにいるか確認
  if (page.url().includes("/login")) {
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', "TestPass123!");
    await page.screenshot({ path: `${dir}/07-login-filled.png`, fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${dir}/08-after-login.png`, fullPage: true });
    console.log("08-after-login: URL =", page.url());
  } else {
    // 既にリダイレクト済み（登録時に自動ログイン）
    await page.screenshot({ path: `${dir}/08-after-login.png`, fullPage: true });
    console.log("08-already-redirected: URL =", page.url());
  }

  // 6. ログイン後の各ページ（認証済みの場合のみ）
  const currentUrl = page.url();
  if (!currentUrl.includes("/login") && !currentUrl.includes("/register")) {
    console.log("認証成功。各ページのスクリーンショットを取得します。");

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/09-dashboard.png`, fullPage: true });
    console.log("09-dashboard: URL =", page.url());

    await page.goto(`${BASE_URL}/salary`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/10-salary.png`, fullPage: true });

    await page.goto(`${BASE_URL}/credit-cards`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/11-credit-cards.png`, fullPage: true });

    await page.goto(`${BASE_URL}/payments`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/12-payments.png`, fullPage: true });

    await page.goto(`${BASE_URL}/budget`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/13-budget.png`, fullPage: true });
  } else {
    console.log("ログインに失敗。認証後のページはスキップ。URL:", currentUrl);
  }

  await context.close();
});
