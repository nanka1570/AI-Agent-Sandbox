import { expect, test } from "@playwright/test";

// 前提: DATABASE_FILE=prisma/test.db に scripts/seed-e2e.ts でシード済み
// （npm run test:e2e がマイグレーション → シード → テストの順で実行する）

test("ダッシュボードに銘柄一覧とシグナル・スコアが表示される", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "NASDAQ-100 シグナル一覧" })
  ).toBeVisible();

  // シード済みの 2 銘柄が表示される
  await expect(page.getByRole("link", { name: "AAPL" })).toBeVisible();
  await expect(page.getByRole("link", { name: "NVDA" })).toBeVisible();

  // AAPL のファンダスコアは 5/5（シードデータで全条件を満たす）
  await expect(page.getByText("5/5")).toBeVisible();

  // 400 日分あるため「データ不足」は表示されない
  await expect(page.getByText("データ不足")).toHaveCount(0);
});

test("銘柄詳細ページにチャートとファンダ内訳が表示される", async ({
  page,
}) => {
  await page.goto("/stocks/NVDA");
  await expect(
    page.getByRole("heading", { name: /NVDA — NVIDIA/ })
  ).toBeVisible();
  await expect(page.getByText("株価（調整後終値）と移動平均")).toBeVisible();
  await expect(page.getByText("RSI (14)")).toBeVisible();
  await expect(page.getByText(/ファンダメンタルズスコア/)).toBeVisible();

  // シード系列は下降→上昇のためゴールデンクロスのシグナル履歴が出る
  await expect(page.getByText(/ゴールデンクロス/).first()).toBeVisible();
});

test("バックテストを実行すると結果が表示される", async ({ page }) => {
  await page.goto("/backtest");
  await page.getByLabel("銘柄").selectOption("NVDA");
  await page.getByLabel("ルール").selectOption("sma-cross");
  await page.getByRole("button", { name: "実行" }).click();

  await expect(page.getByText("戦略リターン")).toBeVisible();
  await expect(page.getByText("Buy & Hold", { exact: true })).toBeVisible();
  await expect(page.getByText("最大ドローダウン")).toBeVisible();
  // ゴールデンクロスが 1 回発生する系列なので取引が記録される
  await expect(page.getByText("1 回")).toBeVisible();
});
