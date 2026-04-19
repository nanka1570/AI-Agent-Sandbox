# kakeibo-app v3 テスト計画書

## 1. 目的と範囲

本書は kakeibo-app v3 の品質保証活動を規定する。Phase 8「テスト実施と報告書」のインプットとなり、テスト実施後は `08_test-result-report.md` に結果を記録する。

### 1.1 テスト対象

| 対象 | 含む | 含まない |
|------|------|---------|
| 機能 | PRD F-01〜F-11（MVP 全機能） | Post-MVP F-12〜F-17 |
| レイヤー | lib/utils, lib/actions, components, app/(main), E2E | Next.js 内部, Supabase 内部, Prisma 内部 |
| 環境 | ローカル開発環境（WSL + Node 22） | 本番環境（Vercel） |

### 1.2 テストの目的

1. AvailableMoney 計算が仕様通りに動くことを保証する（核心指標）
2. クレカ誤差ゼロ照合フローがエンドツーエンドで成立することを保証する（最重要差別化機能）
3. CSV インポート後に Payment が正しく作成されることを保証する（誤差ゼロの前提）
4. RLS によりユーザーは自身のデータのみ参照・更新できることを保証する

## 2. テスト戦略

### 2.1 テストピラミッド

```
             /\
            /  \         E2E (Playwright): 1 本（Golden Path）
           /____\
          /      \       統合 (Vitest): Server Actions × DB
         /________\
        /          \     単体 (Vitest): lib/utils, lib/validations
       /____________\
```

### 2.2 使用ツール

| レイヤー | ツール | 実行コマンド |
|---------|--------|-------------|
| 単体 | Vitest | `npx vitest run` |
| コンポーネント | Vitest + @testing-library/react | `npx vitest run` |
| 統合 | Vitest（テスト用 DB 接続） | `npx vitest run __tests__/integration` |
| E2E | Playwright（chromium, --headed） | `npx playwright test --headed --reporter=list` |

### 2.3 品質ゲート（Phase 8 完了条件）

全て PASS で Phase 8 完了とする:

```bash
npx tsc --noEmit          # 型チェック
npx eslint .              # lint
npx next build            # ビルド
npx vitest run            # 単体/統合テスト（カバレッジ 70%+）
npx playwright test --headed --reporter=list  # E2E Golden Path
```

## 3. 単体テスト計画

### 3.1 `lib/utils/available-money.ts`（P0 最重要）

| # | テストケース | 入力 | 期待結果 |
|---|-------------|------|---------|
| AM-01 | 口座なし・Salary なし・Payment なし | すべて空 | `total = 0` |
| AM-02 | 銀行 30 万のみ | Account(30 万) | `total = 300000` |
| AM-03 | 給料日未到来分を加算 | 今日 4/20, Salary(paymentDate=4/25, 20 万) | `incomingSalary = 200000` |
| AM-04 | 給料日経過分は加算しない | 今日 4/26, Salary(paymentDate=4/25, 20 万) | `incomingSalary = 0` |
| AM-05 | 未引落 Payment を減算 | Payment(status=planned, 1 万) | `unpaidPayments = 10000` |
| AM-06 | 引落済 Payment は減算しない | Payment(status=paid, 1 万) | `unpaidPayments = 0` |
| AM-07 | Statement 未登録でも Payment を減算 | Payment(cardId=X, 5 万), Statement なし | `unpaidPayments = 50000, statementGap = 0` |
| AM-08 | Statement 確定あり・引落未登録 | ΣPayment=5万, confirmedAmount=5.2万 | `statementGap = 2000`（差額分を追加減算） |
| AM-09 | Statement 引落済は重複減算しない | Statement(withdrawnAmount=5万) | その月の Payment は集計から除外 |
| AM-10 | 複合ケース | 今日 4/20, 口座 30 万 + Salary(4/25, 20 万, 未到来) - Payment(status=planned, 3 万) - Statement(ΣPayment=5万, confirmedAmount=5.2万, 引落未記録) | `total = 468000`（300000 + 200000 − 30000 − 2000） |

### 3.2 `lib/utils/reconcile.ts`

| # | テストケース | 期待結果 |
|---|-------------|---------|
| RC-01 | ΣPayment = confirmedAmount | `diff = 0, status = "ok"` |
| RC-02 | ΣPayment < confirmedAmount | `diff > 0, status = "missing"`（未登録明細あり） |
| RC-03 | ΣPayment > confirmedAmount | `diff < 0, status = "excess"`（過剰登録） |
| RC-04 | confirmedAmount 未入力 | `status = "pending"` |

### 3.3 `lib/utils/csv-import.ts`

| # | テストケース | 入力 | 期待結果 |
|---|-------------|------|---------|
| CI-01 | 正常な CSV（3 行） | 日付/金額/摘要 | Payment 3 件のプレビュー |
| CI-02 | ヘッダー自動検出 | 1 行目に列名 | `date, amount, description` 列を認識 |
| CI-03 | 金額のカンマ除去 | "1,234" | `amount = 1234` |
| CI-04 | 日付フォーマット複数対応 | "2026/04/15", "2026-04-15" | 両方パース成功 |
| CI-05 | 重複検出 | 既存 Payment と同じ (usageDate, amount, cardId) | `duplicate = true` フラグ（既知の制限: 同日・同額の別店舗利用は重複扱いとなる／PRD F-07 準拠） |
| CI-06 | 不正行をスキップ | 金額が空の行 | エラー表示 + 該当行を除外 |
| CI-07 | 文字コード（Shift_JIS） | Shift_JIS の CSV | 正しくパース |

### 3.4 `lib/utils/salary-cycle.ts`（v2 移植分）

| # | テストケース | 期待結果 |
|---|-------------|---------|
| SC-01 | 25 日給料日・今日 4/20 | 当月サイクル = 3/25〜4/24 |
| SC-02 | 25 日給料日・今日 4/26 | 当月サイクル = 4/25〜5/24 |
| SC-03 | 月末給料日・2 月 | 2/28 を月末扱い |

### 3.5 `lib/utils/payment-date.ts`（v2 移植分）

| # | テストケース | 入力 | 期待結果 |
|---|-------------|------|---------|
| PD-01 | 締め 15 日・支払翌月 10 日 | 利用 4/10 | 支払日 = 5/10 |
| PD-02 | 締め 15 日・支払翌月 10 日 | 利用 4/20（締め後） | 支払日 = 6/10 |
| PD-03 | 月末締め | 利用 4/30 | 支払日 = 5/10 |

### 3.6 `lib/validations/*.ts`

各 Zod スキーマ（`auth, account, salary, credit-card, category, budget, payment, statement, csv-import`）に対し、正常系 1 + 異常系（必須欠落/型誤り/範囲外）各 1 を最低限実施。

特に `category.ts` では以下を明示的に検証:
- `name` 必須・1〜30 文字
- `color` は 16 進カラー形式（`#RRGGBB`）
- `isDefault = true` の「その他」カテゴリは削除不可（Server Action 側で enforcement、ただしスキーマ段階で `isDeletable` フラグがあれば合わせて検証）

### 3.7 `lib/utils/status.ts`（`determineAutoStatus`）

Payment 3 段階ステータス（planned / confirmed / paid）の自動遷移を検証。AvailableMoney 集計の前提となるため厳密にテストする。

| # | テストケース | 入力 | 期待結果 |
|---|-------------|------|---------|
| ST-01 | 確定日未到来 | today=4/10, confirmedDate=4/15, paymentDate=5/10 | `planned` |
| ST-02 | 確定日到来・支払日未到来 | today=4/16, confirmedDate=4/15, paymentDate=5/10 | `confirmed` |
| ST-03 | 支払日到来 | today=5/11, confirmedDate=4/15, paymentDate=5/10 | `paid` |
| ST-04 | 現金 Payment（確定日なし） | today=4/20, confirmedDate=null, paymentDate=null | `paid`（発生即引落扱い） |

## 4. 統合テスト計画

### 4.1 Server Actions（対テスト DB）

テスト DB: `supabase db reset` で毎回初期化、`__tests__/integration/setup.ts` でシード。RLS 検証のため **ユーザー 2 名（userA, userB）** を事前登録。

| # | 対象 | テスト観点 |
|---|------|-----------|
| IT-01 | `account-actions.createAccount` | 正常作成、userId 自動セット、RLS 検証 |
| IT-02 | `statement-actions.upsertStatement` | 新規作成 & 更新の両方 |
| IT-03 | `statement-actions.recordWithdrawal` | Account.balance 自動減算 + BalanceHistory 追加 |
| IT-04 | `csv-import-actions.bulkCreatePayments` | トランザクション成立、重複行スキップ |
| IT-05 | `payment-actions.updatePayment` | 他ユーザーの Payment を更新できないこと（RLS） |
| IT-06 | `category-actions.initializeDefaultCategories` | 初回ログイン時にデフォルトカテゴリが自動生成される、2 回目以降は重複生成されない。**カテゴリの具体的な初期値（名称・色・順序）は `01_product-requirements.md` F-05A のカテゴリ初期値定義に従うこと**（実装時に PRD と突き合わせて確定） |
| IT-07 | `auth-actions.resetPassword` | パスワードリセットメール送信 API がエラーなく呼ばれる（Supabase 側の送信は E2E 範囲外、戻り値のみ検証） |

### 4.2 RLS テスト

| # | 観点 | 期待結果 |
|---|------|---------|
| RLS-01 | ユーザー A が ユーザー B の Payment を SELECT | 0 件 |
| RLS-02 | ユーザー A が ユーザー B の Account を UPDATE | エラー |
| RLS-03 | 未認証ユーザーが SELECT | エラー |

## 5. コンポーネントテスト計画

### 5.1 優先対象（ロジック複雑度の高いもの）

| # | コンポーネント | テスト観点 |
|---|---------------|-----------|
| CT-01 | `AvailableMoneyCard` | breakdown の各項目が正しく表示される、負値時の警告表示 |
| CT-02 | `StatementDiff` | 差額 0 時に「OK」バッジ、差額ありで色分け表示 |
| CT-03 | `CsvUploader` | ファイル選択・ドラッグ&ドロップ両方で onUpload 発火 |
| CT-04 | `ColumnMapper` | 列選択変更時に onChange が発火、未選択列のバリデーション |
| CT-05 | `QuickPaymentDialog` | カレンダー日付クリック → ダイアログ開き、登録後に閉じる |
| CT-06 | `CalendarDayCell` | 日別 Payment 合計額の集計表示、0 円時は非表示、選択日のハイライト |
| CT-07 | `MonthlyReportChart` | Payment 一覧からカテゴリ別集計を生成し、Recharts の `<PieChart>` / `<BarChart>` に渡すデータ形状（`{name, value}[]`）が正しいこと |

## 6. E2E テスト計画

### 6.1 Golden Path シナリオ

`__tests__/e2e/golden-path.spec.ts` に 1 本実装。

```
1. 新規ユーザー登録（test-e2e-{timestamp}@example.com）
2. ログイン
3. 口座作成: 名前「メイン銀行」/ type=bank / balance=300000
4. 給料登録: 月給 200000 / paymentDate=25 / 次回給料日=今月 25 日
5. クレカ登録: 名前「楽天カード」/ closingDay=15 / paymentMonthOffset=1 / paymentDay=10
6. CSV インポート:
   - ファイル: __tests__/e2e/fixtures/rakuten-sample.csv（3 件、合計 25000）
   - 列マッピング: 日付/金額/摘要
   - プレビュー確認 → 一括登録
7. ダッシュボード確認:
   - AvailableMoney 表示あり
   - breakdown に 4 項目表示
8. Reconcile 画面遷移:
   - 利用月プルダウン選択
   - Payment 3 件の合計が 25000 と表示
   - Statement confirmedAmount に 25000 入力 → 保存
   - 差額 0 円「OK」バッジ表示を確認
9. Statement 引落記録:
   - withdrawnAmount=25000, withdrawnAt=今日, accountId=メイン銀行
   - 保存後、Account.balance が 275000 に減算されることを確認
10. ダッシュボードで AvailableMoney が更新されていることを確認
```

### 6.2 テストフィクスチャ

```
__tests__/e2e/fixtures/
├── rakuten-sample.csv        # 楽天カード形式の3行サンプル
└── README.md                  # 各 CSV の列構造
```

### 6.3 E2E スコープ外の受け入れ条件（手動 or 統合で代替）

| PRD 受け入れ条件 | 代替手段 | 理由 |
|----------------|---------|------|
| F-01 パスワードリセットメール受信 → 再設定 | IT-07（リセットメール送信 API 呼び出し）+ 手動確認チェックリスト | 外部メール（Supabase 側送信）に依存するため自動化困難 |
| F-01 メール確認リンク経由のユーザー登録 | サインアップ API の戻り値のみ E2E で検証、メール確認は手動 | 同上 |

手動チェックリストは `08_test-result-report.md` の「5. 未実施 / 保留項目」に実施結果を記録する。

### 6.4 実行時の注意

- WSL 環境では `npx playwright install chromium` + `sudo apt-get install` で事前準備（詳細 `03_architecture.md` 参照）
- `--headed` でブラウザ表示しながら実行（MEMORY.md の規約）
- 失敗時は `test-results/` にスクリーンショットと trace を残す

## 7. テストデータ戦略

### 7.1 単体テスト

インメモリでオブジェクトを直接構築（DB アクセスなし）。

### 7.2 統合 / E2E テスト

- ローカル Supabase を `supabase start` で起動
- 各テストスイート開始時に `supabase db reset` で初期化
- ユーザー登録は UI 経由（Supabase Auth のサインアップフロー）

## 8. カバレッジ目標

| レイヤー | 目標 | 備考 |
|---------|------|------|
| `lib/utils/available-money.ts` | 100% | 核心指標 |
| `lib/utils/reconcile.ts` | 100% | 誤差ゼロの要 |
| `lib/utils/status.ts` | 100% | Payment 3 段階遷移は AvailableMoney の前提 |
| `lib/utils/csv-import.ts` | 90%+ | |
| `lib/actions/*` | 80%+ | RLS 観点含む |
| `components/*` | 60%+ | 表示ロジックが複雑なもの優先 |
| 全体 | 70%+ | |

計測コマンド: `npx vitest run --coverage`

## 9. 欠陥管理

### 9.1 欠陥の記録

テスト実施で見つかった不具合は `docs/08_test-result-report.md` の「検出不具合一覧」に以下を記録:

- 発見日時、テスト ID、現象、期待結果、実際の結果、重大度（Critical/High/Medium/Low）、修正状況

### 9.2 修正の優先度

- Critical / High: Phase 8 中に修正必須
- Medium: 修正計画を `08_test-result-report.md` に明記
- Low: Post-MVP 対応可

## 10. リスクと対応

| リスク | 影響 | 対応 |
|--------|------|------|
| Supabase ローカル起動失敗 | 統合/E2E 実行不可 | Docker Desktop 再起動、ポート競合確認 |
| Playwright ライブラリ不足（WSL） | E2E 実行不可 | 手動 `sudo apt-get install`（MEMORY.md 参照） |
| CSV 文字コード対応漏れ | CI-07 失敗 | `iconv-lite` または `TextDecoder` で吸収 |
| 時間依存テストのフレーク | AM-03, AM-04 不安定 | `vi.setSystemTime()` で固定時刻化 |
