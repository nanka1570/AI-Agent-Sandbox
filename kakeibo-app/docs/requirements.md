# 家計簿アプリ (kakeibo-app) 要件・仕様書

## コンセプト

給料日とクレジットカード支払日を管理し、クレカ料金が確定したら支払い額を可視化できる家計簿アプリ。
**MVP優先**：まず動くものを最短で作り、動いてから拡張する。

---

## 技術スタック（MVP）

| カテゴリ | 選定 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript 5 (strict) |
| UI | Tailwind CSS v4 + shadcn/ui |
| DB | Prisma + SQLite |
| チャート | Recharts |
| 日付処理 | date-fns |
| フォーム | React Hook Form + Zod |
| テスト | Vitest + Testing Library + Playwright |
| リンター | ESLint + Prettier |

---

## データモデル

### Salary（給料）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | String (cuid) | 主キー |
| payDay | Int | 支給日（1-31） |
| amount | Int | 手取り額（円） |
| month | String | 対象月 "2026-03" |
| memo | String? | メモ |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### CreditCard（クレジットカード）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | String (cuid) | 主キー |
| name | String | カード名 |
| closingDay | Int | 締め日（1-31） |
| paymentDay | Int | 支払い日（1-31） |
| memo | String? | メモ |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |
| payments | Payment[] | 支払い一覧（リレーション） |

### Payment（支払い）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | String (cuid) | 主キー |
| creditCardId | String | クレカID（外部キー） |
| month | String | 対象月 "2026-03" |
| amount | Int | 確定金額（円） |
| status | String | ステータス: unconfirmed / confirmed / paid |
| memo | String? | メモ |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

---

## Phase 別仕様

### Phase 0: プロジェクト基盤セットアップ
**作業内容:**
1. CLAUDE.md 作成
2. .claude/settings.json にHooks設定
3. .claude/agents/ にSubagent 3種を作成
4. .claude/commands/ にカスタムコマンドを作成
5. docs/requirements.md 作成
6. docs/progress.md 作成

**コミット:** `chore: kakeibo-app プロジェクト基盤セットアップ`
**完了基準:** 全ファイルが存在すること

---

### Phase 1: Next.js プロジェクト初期化 + DB設計
**作業内容:**
1. `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
2. 追加パッケージインストール（prisma, @prisma/client, recharts, date-fns, zod, react-hook-form, @hookform/resolvers）
3. shadcn/ui セットアップ
4. Prettier設定（.prettierrc）
5. Prismaセットアップ（SQLite）
6. スキーマ定義 + マイグレーション
7. Prisma クライアント (src/lib/db.ts)
8. 共通レイアウト（ナビゲーション付き）

**コミット:** `feat: Phase 1 - Next.js初期化 + Prisma DB設計`
**完了基準:**
- `npm run build` 成功
- `npx prisma studio` でDBが表示される
- ナビゲーション付きレイアウトがブラウザに表示される

---

### Phase 2: クレジットカード管理 CRUD
**作業内容:**
1. クレカ一覧ページ（/credit-cards）— Server Component でデータ取得
2. クレカ登録フォーム — React Hook Form + Zod バリデーション
3. クレカ編集機能
4. クレカ削除機能（確認ダイアログ付き — shadcn/ui AlertDialog）
5. Server Actions (src/lib/actions/credit-card.ts)
6. Zod スキーマ (src/types/index.ts に定義)
7. テスト作成

**画面:**
- /credit-cards: カード名、締め日、支払い日をカード形式で一覧表示
- 登録/編集: ダイアログ（モーダル）形式

**バリデーション:**
- name: 必須、1〜50文字
- closingDay: 必須、1〜31の整数
- paymentDay: 必須、1〜31の整数

**コミット:** `feat: Phase 2 - クレジットカード管理CRUD`
**完了基準:**
- クレカの登録・表示・編集・削除が全て動作
- Zodバリデーションが動く（不正値でエラー表示）
- テストが通る

---

### Phase 3: 給料管理 CRUD
**作業内容:**
1. 給料一覧ページ（/salary）— 月別表示
2. 給料登録フォーム（月選択 + 支給日 + 金額入力）
3. 給料編集・削除
4. Server Actions (src/lib/actions/salary.ts)
5. テスト作成

**画面:**
- /salary: 月別にテーブル形式で一覧表示（月、支給日、金額、メモ）

**バリデーション:**
- month: 必須、"YYYY-MM" 形式
- payDay: 必須、1〜31の整数
- amount: 必須、1以上の整数

**コミット:** `feat: Phase 3 - 給料管理CRUD`
**完了基準:**
- 給料の登録・表示・編集・削除が全て動作
- テストが通る

---

### Phase 4: 支払い管理
**作業内容:**
1. 支払い一覧ページ（/payments）— 月別フィルター付き
2. 支払い登録フォーム（クレカ選択、月選択、金額入力）
3. ステータス管理: ステータスバッジ + 変更ボタン
   - unconfirmed（未確定）→ グレーバッジ
   - confirmed（確定）→ 青バッジ
   - paid（支払い済み）→ 緑バッジ
4. 支払い編集・削除
5. Server Actions (src/lib/actions/payment.ts)
6. テスト作成

**画面:**
- /payments: 月別フィルター + テーブル形式（クレカ名、月、金額、ステータス）

**バリデーション:**
- creditCardId: 必須、存在するクレカのID
- month: 必須、"YYYY-MM" 形式
- amount: 必須、1以上の整数

**コミット:** `feat: Phase 4 - 支払い管理`
**完了基準:**
- 支払いのCRUD + ステータス変更が動作
- 月別フィルターが動く
- テストが通る

---

### Phase 5: ダッシュボード
**作業内容:**
1. 今月の収支サマリーカード
   - 給料合計
   - 支払い合計（確定 + 支払い済み）
   - 残額（給料 - 支払い）
2. 今月の支払い予定一覧（日付順、ステータス付き）
3. 月別支出推移グラフ（Recharts 棒グラフ、直近6ヶ月）
4. クレカ別支出グラフ（Recharts 円グラフ）
5. テスト作成

**画面:**
- / (ルート): ダッシュボード

**コミット:** `feat: Phase 5 - ダッシュボード + グラフ`
**完了基準:**
- 全データが正しく集計・表示される
- グラフが正常に描画される
- データなし時も正常に表示される
- テストが通る

---

### Phase 6: UI/UXポリッシュ
**作業内容:**
1. レスポンシブ対応（モバイルファースト）
   - BottomNav（モバイル）/ Sidebar（デスクトップ）切り替え
2. ローディング状態（Suspense + loading.tsx）
3. エラーハンドリング（error.tsx）
4. 空状態の表示（データなし時のメッセージとアクション）
5. トースト通知（shadcn/ui Sonner）— CRUD操作の成功/失敗
6. Gemini向けデザインプロンプト作成（docs/gemini-design-prompt.md）

**コミット:** `feat: Phase 6 - UI/UXポリッシュ`
**完了基準:**
- モバイル（375px〜）でもレイアウトが崩れない
- エラー・ローディング・空状態が適切に表示される
- CRUD操作でトースト通知が出る

---

### Phase 7: E2Eテスト + 最終調整
**作業内容:**
1. Playwright セットアップ + E2Eテスト
   - フロー1: クレカ登録 → 支払い登録 → ダッシュボード確認
   - フロー2: 給料登録 → ダッシュボード確認
   - フロー3: 支払いステータス変更 → ダッシュボード更新確認
2. エッジケース対応（月末処理、31日のない月など）
3. 最終調整（パラメータ・表示の微調整）
4. README.md 作成

**コミット:** `test: Phase 7 - E2Eテスト + 最終調整`
**完了基準:**
- 全テスト通過（Vitest + Playwright）
- 全ページ正常動作
- README.md 完成

---

## Phase B（MVP完成後の拡張候補）

| 機能 | 技術 |
|------|------|
| 認証 | Supabase Auth + Middleware |
| DB移行 | Prisma SQLite → Supabase PostgreSQL |
| サーバー状態管理 | TanStack Query |
| 予算管理 | 月別予算設定、超過アラート |
| カテゴリ管理 | 支出のカテゴリ分類 |
| レポート | 月次/年次レポート生成 |
| デプロイ | Vercel |
| PWA対応 | next-pwa |
