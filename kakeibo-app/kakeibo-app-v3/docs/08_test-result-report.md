# kakeibo-app v3 テスト結果報告書

## 1. 概要

| 項目 | 内容 |
|------|------|
| 対象バージョン | kakeibo-app v3 (MVP) |
| テスト期間 | 2026-04-17（Phase 8 初回実施） / 2026-04-18（1〜2 次レビュー反映） / 2026-04-17（全コード 3 次レビュー反映） |
| 実施者 | Claude Code (自動実装セッション) |
| テスト計画書 | `06_test-plan.md` |
| 実行環境 | WSL2 (Ubuntu) + Node.js 22 + Next.js 16.1.6 |

## 2. テスト実施サマリ

### 2.1 品質ゲート結果

| ゲート | コマンド | 結果 | 備考 |
|--------|---------|------|------|
| 型チェック | `npx tsc --noEmit` | ✅ PASS | エラー 0 件 |
| ビルド | `npx next build` | ✅ PASS | 全 18 ルート正常生成（Turbopack） |
| 単体 | `npx vitest run` | ✅ PASS | 23/23 成功 |
| E2E | `npx playwright test --reporter=list` | ✅ PASS | 5/5 成功 |

Lint は MVP 範囲外（Phase 毎にソースレビューで代替）。

### 2.2 テストケース実施結果

| レイヤー | 実装ファイル | 実施数 | PASS | FAIL |
|---------|-------------|------|------|------|
| 単体（Reconcile） | `__tests__/unit/lib/reconcile.test.ts` | 3 | 3 | 0 |
| 単体（Payment Date） | `__tests__/unit/lib/payment-date.test.ts` | 4 | 4 | 0 |
| 単体（CSV Import） | `__tests__/unit/lib/csv-import.test.ts` | 4 | 4 | 0 |
| 単体（Salary Cycle） | `__tests__/unit/lib/salary-cycle.test.ts` | 6 | 6 | 0 |
| 単体（Status） | `__tests__/unit/lib/status.test.ts` | 5 | 5 | 0 |
| 単体（スモーク） | `__tests__/unit/smoke.test.ts` | 1 | 1 | 0 |
| E2E（公開画面） | `__tests__/e2e/golden-path.spec.ts` | 5 | 5 | 0 |
| **合計** | | **28** | **28** | **0** |

> MVP 版の Phase 8 では、コアロジック（誤差ゼロ照合・日付計算・CSV 正規化・給料サイクル・ステータス遷移）の単体テストと、未認証時のルーティング／フォーム要素存在確認の E2E に絞って自動化した。ユーザー認証を伴う E2E（口座作成 → 引落記録の Golden Path 全量）は Supabase ローカル環境の起動が前提となるため、手動確認で補完する。

## 3. 実装完了 Phase 一覧

| Phase | 内容 | 成果物 | 状態 |
|------|------|-------|------|
| 0 | 8 文書体系作成 | `docs/01〜07` | ✅ 完了 |
| 1 | 雛形構築 | Next.js 16 / TS strict / Prisma / Supabase / shadcn | ✅ 完了 |
| 2 | 認証移植 | `(auth)/`, auth-actions, `/auth/callback` | ✅ 完了 |
| 3 | マスター CRUD | Category / Salary / Account / CreditCard / Budget / Menu | ✅ 完了 |
| 4 | Payment + Statement + CSV 取り込み | payment-actions / statement-actions / csv-import-actions / `/payments/import` / `/reconcile` | ✅ 完了 |
| 5 | ダッシュボード再設計 | `available-money.ts` / `AvailableMoneyCard` | ✅ 完了 |
| 6 | カレンダー画面 | `MonthCalendar` / `/calendar` | ✅ 完了 |
| 7 | レポート画面 | Recharts Pie / Bar / `/reports` | ✅ 完了 |
| 8 | テスト実施 + レビュー反映 | 単体 23 / E2E 5 / 本報告書 + 指摘 14 件修正 | ✅ 完了 |

## 4. 生成ルート一覧（`next build` ベース）

```
/ (ダッシュボード)          /accounts         /auth/callback
/budget                    /calendar          /categories
/credit-cards              /credit-cards/[id]/reconcile
/forgot-password           /login             /menu
/payments                  /payments/import
/register                  /reports           /reset-password
/salary
```

## 5. 検出不具合と修正

Phase 3/4/8 のレビューで計 14 項目（Critical 2 / High 6 / Warning 6）を検出し、**全件修正済み**。Suggestion 2 件も併せて対応済み。さらに 3 次全体レビューで Medium 4 件 / Low 4 件を追加修正（対応可能なもののみ・MVP 範囲外は明示スキップ）。

### 5.1 Critical（2 件・全件修正済）

| # | 検出フェーズ | 現象 | 修正内容 |
|---|-------------|------|---------|
| C-1 | Phase 8 レビュー | `getAvailableMoney` の `unpaidPayments` と `statementGap` で Statement 存在月の Payment が二重計上され、「使えるお金」が常に過小表示 | Statement キー Set を作成し、該当 Payment を `unpaidPayments` から除外。`statementGap` を `Math.max(confirmedAmount, paymentsSum)` に変更。N+1 クエリも同時解消 |
| C-2 | Phase 8 レビュー | `recordWithdrawal` が `withdrawnAt` 既存チェックなしで二重引落可能 | `stmt.withdrawnAt !== null` ガードを追加 |

### 5.2 High（6 件・全件修正済）

| # | 現象 | 修正内容 |
|---|------|---------|
| H-1 | `confirmationDay` と `confirmationMonthOffset` の共存制約が未検証 | `creditCardSchema` に `.refine()` で両方設定 or 両方 null を強制 |
| H-2 | CSV インポートが N+1（最大 200 往復／100件） | 事前 `findMany` による重複セット構築 + `createMany` 一括 INSERT に刷新 |
| H-3 | 給料サイクル境界値のテスト不足 | `salary-cycle.test.ts` を新規作成（6 ケース: 25日 / 1日 / 末日32 / 2月またぎ / isDateInCycle 境界） |
| H-4 | Layout の check-then-act 冗長 | 事前 `count` チェックを撤去し `createDefaultCategories` の内部冪等性に委譲 |
| H-5 (再) | `payment-actions` の `month` がクライアント送信値依存で CSV ルートと一貫性欠如 | `const month = format(usageDate, "yyyy-MM")` でサーバー側再計算に統一 |
| — | Phase 3 初回検出の 5 件（カテゴリ冪等性・Budget 所有権・`confirmationMonthOffset.max(2)`・Next.js バージョン整合・CSV テストデータ） | 全件 Phase 3/4 で修正済 |

### 5.3 Warning（6 件・全件修正済）

| # | 現象 | 修正内容 |
|---|------|---------|
| W-1 | `withdrawnAmount` が 0 円を許容 | Zod `min(1)` に変更 |
| W-2 | `reports/page.tsx` が `usageDate` 範囲でフィルタ（`month` 不一致リスク） | `where: { userId, month }` および `month: { in: recentMonths }` に変更 |
| W-3 | `normalizeDate` の `new Date(trimmed)` フォールバックがロケール依存 | フォールバックを削除し、正規表現不一致は明示的にエラーに集約 |
| W-4 | `available-money.ts` の N+1 | C-1 修正で同時解消 |
| W-5 | CSV インポート失敗時のエラー回復 UX 不足 | `importError` state とエラーバナーを追加 |
| W-6 | `payment-form.tsx` の hidden input の value 上書きが RHF 内部状態と乖離 | `useEffect` + `setValue("month", ...)` で同期、hidden input は `register` のみに |

### 5.4 Suggestion（対応 2 件・Post-MVP 1 件）

| # | 現象 | 対応 |
|---|------|------|
| S-1 | Salary の (userId, month) 重複登録可 | `createSalary` / `updateSalary` に重複チェックを追加 |
| S-3 | 主要純粋関数のテスト網羅不足 | `determineAutoStatus` + `getNextStatus` のテストを追加（5 ケース） |
| S-2 | `payments/page.tsx` のページネーション欠落 | Post-MVP 扱い（数千件規模で顕在化） |

### 5.5 Medium / Low（3 次全体レビュー・対応可能分のみ）

| # | 区分 | 現象 | 対応 |
|---|------|------|------|
| M-1 | Medium | `statementGap` が仕様書（glossary.md）の「符号付き差額」と乖離し `Math.max` で過小評価されていた | `confirmedAmount − paymentsSum` の符号付き集計に変更し仕様準拠 |
| M-2 | Medium | `layout.tsx` での `createDefaultCategories` 実行がセッション更新タイミングに弱い | `auth/callback/route.ts` で `exchangeCodeForSession` 直後に実行へ移設 |
| M-3 | Medium | `recordWithdrawal` の残高更新が非アトミックで競合時に不整合リスク | Prisma `{ decrement: n }` と `tx.update` 返り値の `select: { balance }` で一括化 |
| M-4 | Medium | `ensureFallbackCategory` が `payment-actions` / `csv-import-actions` で重複定義 | `lib/utils/fallback-category.ts` に共通化 |
| L-3 | Low | `Cell` / リスト要素で `key={i}`（配列 index）使用 | `d.name` / 複合キーへ置換（リオーダー時のリマウント回避） |
| L-8 | Low | `statement.id!` の非 null アサーション使用 | ローカル const で narrowing を保持し non-null assertion を除去 |
| L-1 / L-2 | Low | `as PaymentStatus` キャスト | フォールバック `??` と併用で実害なしのため現状維持 |
| L-4 | Low | `monthToSortOrder` の `throw` が schema regex 検証後に unreachable | 防御的コードとして残置（コスト微小） |
| M-5 / M-7 / L-5 / L-9 | Medium/Low | ページネーション / CSV フル件数メッセージ / Budget 一括更新 / 負値正規化 UX | Post-MVP 計画に追記（下記 7.3 参照） |

## 6. E2E Golden Path（未実施分は手動確認で代替）

全 10 ステップのうち、認証不要の 1〜2 を自動化し、3 以降は Supabase の実データに依存するため手動確認で代替する。

| ステップ | 内容 | 結果 | 備考 |
|---------|------|------|------|
| 1 | 未認証時 `/` → `/login` リダイレクト | ✅ 自動 PASS | |
| 2 | ログイン画面フォーム表示 | ✅ 自動 PASS | |
| 3〜10 | 口座作成 → 給料 → カード → CSV → Statement → 引落 → ダッシュボード確認 | ⏳ 手動確認（Supabase 起動必要） | MVP 後の実運用で検証 |

## 7. 所見

### 7.1 良かった点

- **コアロジックのテスト容易性**: `calculateStatementDiff` / `applyMapping` / `calculateSalaryCycle` / `determineAutoStatus` など純粋関数として切り出した結果、単体テストの工数が極小で済んだ。
- **Next.js 16 + Turbopack の高速ビルド**: フルビルド 3 秒未満（13 静的 + 5 動的）で開発サイクルが短い。
- **Server Actions + RHF + Zod の組み合わせ**: バリデーション境界が明瞭で、全 CRUD で `ActionResult<T>` 型を統一できた。
- **サーバー側での再計算統一**: `month` フィールドを手動登録・CSV の両ルートでサーバー側 `format(usageDate, "yyyy-MM")` に統一したことで、クライアント信頼依存を排除できた。

### 7.2 課題 / 改善点

- **Zod v4 の coerce 型推論**: `z.coerce.number()` の推論が `unknown → number` になり RHF の Resolver 型と衝突。`valueAsNumber: true` 併用で解決したが、schema 再利用時は注意が必要。
- **Radix UI Select の空文字禁止**: `NO_BRAND="__none__"` 等のセンチネル値で対処。MVP では許容範囲だが、将来型安全なラッパーを検討。
- **給料サイクル末日コードの境界**: `payDay=32` のサイクル終端が仕様上「次月末」と「次月末 -1」のどちらか要確定（現実装は次月末。Post-MVP で給料サイクル仕様を明文化予定）。

### 7.3 Post-MVP へ引き継ぐ事項

- **E2E Golden Path の完全自動化**: Supabase ローカル環境を CI に統合し、認証 〜 引落までを自動検証する。
- **ページネーション（S-2）**: `payments/page.tsx` に `take` / `skip` を追加、カレンダーもカーソル方式に拡張。
- **CSV プリセット保存**: localStorage に「楽天カード」「三井住友カード」等のマッピングを保存して再利用。
- **カレンダーからの Payment 詳細表示**: 現状は登録ダイアログのみ。日付セルクリックで当日の明細リストを出す。
- **スキーマレベルの重複防止**: Salary に `@@unique([userId, month])` を追加（現在はアプリケーション層のみでチェック）。

## 8. 結論

| 項目 | 判定 |
|------|------|
| MVP リリース可否 | ✅ 可 |
| 残留 Critical / High / Medium | 0 件 / 0 件 / 0 件（Post-MVP 繰越を除く） |
| 条件 | 3〜10 の E2E Golden Path を Supabase 本番環境で手動確認する |
| 報告者承認 | Claude Code |
| 報告日 | 2026-04-17（3 次全体レビュー反映） |
