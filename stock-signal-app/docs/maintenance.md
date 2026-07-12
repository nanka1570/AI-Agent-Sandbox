# 運用・メンテナンス手順

## 日常の運用

### データ更新

- ダッシュボードの「データ更新」ボタンで全銘柄を差分同期する
- **米国市場の取引終了後（日本時間の朝 6〜7 時以降）に実行するのが確実**。取引時間中に実行しても、途中の価格は次回の同期で確定値に上書きされる仕組みなので害はない
- 失敗した銘柄は画面に一覧表示される。「失敗分を再実行」で該当銘柄だけ再取得できる（何度実行しても安全）

### DB のリセット

DB が壊れた・作り直したいとき:

```bash
rm prisma/dev.db*
npx prisma migrate dev
# アプリを起動して「データ更新」を実行
```

株価データはすべて API から再取得できるため、`prisma/dev.db` にバックアップ必須のデータはない。

## 定期メンテナンス

### NASDAQ-100 構成銘柄の更新（年数回）

指数の構成は年数回入れ替わる（毎年 12 月の定期見直し + 臨時入れ替え）。半年に 1 回程度、以下を行う:

1. 現在の構成を確認する。例: <https://stockanalysis.com/list/nasdaq-100-stocks/>（他に slickcharts.com、nasdaq.com など）
2. `lib/constants/nasdaq100.ts` を編集する
   - **追加**: `{ ticker, name, sector }` を該当セクターの並びに追記。`sector` は同ファイルの `SECTORS` のいずれかにすること
   - **除外**: 配列から削除する。DB に残った過去データは表示されなくなるだけで害はない（気になる場合は DB をリセット）
3. `npm test` を実行する（銘柄リストの重複・セクター名の誤りはテストが検出する）

NASDAQ-100 外の主要テック（NYSE 上場の ORCL・CRM・IBM 等）は同ファイルの `EXTRA_TECH` に定義している。追加・削除の手順は上と同じ（NASDAQ-100 入りした銘柄は `EXTRA_TECH` から削除して重複を避ける。重複はテストが検出する）。

### 依存パッケージの更新

```bash
npm outdated
```

- **Next.js のメジャーアップデート時**: 破壊的変更が多いため、`node_modules/next/dist/docs/` の同梱ドキュメントを確認してから直す（`AGENTS.md` の注意書きどおり）
- **Prisma 更新時**: `npx prisma generate` → `npm test` → `npm run build` で確認

## トラブル対応

### データ取得が全銘柄失敗するようになった

yahoo-finance2 は**非公式 API** のため、Yahoo 側の仕様変更で突然壊れることがある。切り分けと対処:

1. まず yahoo-finance2 の更新を確認: `npm outdated yahoo-finance2` → 更新があれば上げて再試行（Yahoo の変更に追従した修正が出ていることが多い）
2. GitHub の issue を確認: <https://github.com/gadicc/yahoo-finance2/issues>
3. それでも駄目なら**データ取得層を差し替える**。影響範囲は `lib/data/yahoo.ts` の 2 関数だけに隔離してある:
   - `fetchDailyPrices(ticker, period1)` → `PriceRow[]`（`lib/data/transform.ts` の形式）
   - `fetchFundamentals(ticker)` → `FundamentalData`
   - 代替候補（2026-07 時点）: Alpha Vantage（無料 25 リクエスト/日 — 101 銘柄の一括同期には足りない点に注意）、Financial Modeling Prep（無料 250 リクエスト/日）、Stooq（日足 CSV、ファンダなし）

### E2E テストの環境構築（WSL）

`npx playwright install --with-deps` は内部で sudo を使うため WSL では失敗する。以下の手順で入れる:

```bash
npx playwright install chromium   # ブラウザ本体のみダウンロード
```

起動時にライブラリ不足エラーが出たら、不足分を apt で入れる:

```bash
sudo apt-get install libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 \
  libcups2t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2t64
```

### E2E が「Another next dev server is already running」で落ちる

Next.js 16 は同一ディレクトリで dev サーバーを二重起動できない。起動中の `npm run dev` を止めてから `npm run test:e2e` を実行する。

## AI 下書き機能の有効化（課金開始時）

銘柄詳細ページの「AI で下書きを生成」（SEC の年次報告書から国別売上・事業構成を抽出）は、Anthropic API キーを設定すると使える。未設定の間はボタンが無効化されるだけで、他の機能に影響はない。

1. <https://platform.claude.com/> で API キーを取得（従量課金の設定が必要）
2. `.env.example` を `.env.local` にコピーし、`ANTHROPIC_API_KEY=sk-ant-...` を設定
3. dev サーバーを再起動

- **コスト目安**: 既定モデル（claude-haiku-4-5）で 1 銘柄あたり約 1〜2 円。年次報告書は年 1 回しか変わらないため、実行は銘柄ごとに年数回で十分
- **モデル変更**: `.env.local` の `AI_MODEL` で差し替え（精度重視なら `claude-sonnet-5` 等。コスト増）
- **注意**: 生成されるのは「下書き」。出典 URL が末尾に付くので、保存前に原文と照合すること
- **SEC EDGAR 側の障害時**: `lib/ai/edgar.ts` が取得部。SEC はレート制限（10 req/秒）があるが手動実行なら影響なし

### 型エラー「Cannot find module '@/generated/prisma/client'」

Prisma クライアントが未生成。`npx prisma generate` を実行する（`npm install` の postinstall でも実行される）。

### Route/Page の型エラー（`RouteContext` / `PageProps` が見つからない）

Next.js 16 の生成型が古い。`npx next typegen` を実行する（`next dev` / `next build` でも生成される）。
