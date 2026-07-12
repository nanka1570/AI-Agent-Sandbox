import { expect, test } from "@playwright/test";

// 前提: DATABASE_FILE=prisma/test.db に scripts/seed-e2e.ts でシード済み
// （npm run test:e2e がマイグレーション → シード → テストの順で実行する）

test("ダッシュボードに銘柄一覧・タイプ分類・逆行高が表示される", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "米国テック株シグナル一覧" })
  ).toBeVisible();

  // シード済みの 2 銘柄が表示される（QQQ はベンチマークなので一覧に出ない）
  await expect(page.getByRole("link", { name: "AAPL" })).toBeVisible();
  await expect(page.getByRole("link", { name: "NVDA" })).toBeVisible();
  await expect(page.getByRole("link", { name: "QQQ" })).toHaveCount(0);

  // 銘柄タイプ分類（AAPL = 王者型、NVDA = V字回復型になるシードデータ）
  await expect(page.getByText("実績先行の王者型")).toBeVisible();
  await expect(page.getByText("V字回復型")).toBeVisible();

  // ベンチマーク（QQQ）が最終日に下落するシードのため逆行高が出る
  await expect(page.getByText("逆行高").first()).toBeVisible();

  // 400 日分あるため「データ不足」は表示されない
  await expect(page.getByText("データ不足")).toHaveCount(0);
});

test("銘柄詳細にテクニカル状態・チャート・ファンダ判定・メモ欄が表示される", async ({
  page,
}) => {
  await page.goto("/stocks/NVDA");
  await expect(
    page.getByRole("heading", { name: /NVDA — NVIDIA/ })
  ).toBeVisible();

  // テクニカル状態パネル
  await expect(page.getByText("テクニカル状態")).toBeVisible();
  await expect(page.getByText("価格 vs MA:")).toBeVisible();

  // チャート（価格 + MA + BB、出来高、RSI）
  await expect(
    page.getByText("株価（調整後終値）・移動平均・ボリンジャーバンド±2σ")
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "出来高" })).toBeVisible();
  await expect(page.getByText("RSI (14)")).toBeVisible();

  // シグナル履歴（下降→上昇のシードなのでゴールデンクロスが出る）
  await expect(page.getByText(/ゴールデンクロス/).first()).toBeVisible();

  // ファンダ判定（6カテゴリ）と決算サプライズ
  await expect(page.getByText(/ファンダメンタルズ判定/)).toBeVisible();
  await expect(page.getByText("安全性（倒れないか）", { exact: false })).toBeVisible();
  await expect(page.getByText(/決算サプライズ/)).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "+10.0%" })
  ).toBeVisible(); // シードのサプライズ値

  // 手動メモ欄（国別売上など API で取れない情報用）
  await expect(page.getByText(/手動メモ/)).toBeVisible();
  await expect(page.getByRole("button", { name: "メモを保存" })).toBeVisible();
});

test("バックテストを実行すると結果が表示される", async ({ page }) => {
  await page.goto("/backtest");
  await page.getByLabel("銘柄").selectOption("NVDA");
  await page.getByLabel("ルール").selectOption("sma-cross");
  await page.getByRole("button", { name: "実行" }).click();

  await expect(page.getByText("戦略リターン")).toBeVisible();
  await expect(page.getByText("Buy & Hold", { exact: true })).toBeVisible();
  await expect(page.getByText("最大ドローダウン")).toBeVisible();
  // 下降→上昇のシード系列では 5/25 のゴールデンクロスが 1 回発生する
  await expect(page.getByText("1 回")).toBeVisible();
});
