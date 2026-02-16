# 家計簿アプリ (kakeibo-app) プロジェクトルール

## 技術スタック
- Next.js 15 (App Router) + TypeScript 5 (strict)
- UI: Tailwind CSS v4 + shadcn/ui
- DB: Prisma + SQLite（MVP）→ Supabase PostgreSQL（Phase B）
- チャート: Recharts
- 日付: date-fns
- フォーム: React Hook Form + Zod
- テスト: Vitest + React Testing Library + Playwright
- リンター: ESLint + Prettier

## ビルド・テストコマンド
- 開発サーバー: `npm run dev`
- ビルド: `npm run build`
- テスト: `npm run test`
- リント: `npm run lint`
- フォーマット: `npx prettier --write .`
- 型チェック: `npx tsc --noEmit`
- Prisma マイグレーション: `npx prisma migrate dev`
- Prisma Studio: `npx prisma studio`
- E2E テスト: `npx playwright test`

## コーディング規約
- コンポーネント名: PascalCase (例: CreditCardForm)
- ファイル名: コンポーネントは kebab-case.tsx、それ以外は kebab-case.ts
- 関数名: camelCase
- 定数: UPPER_SNAKE_CASE
- 型定義: PascalCase (例: CreditCard, Payment)
- CSS: Tailwind ユーティリティクラスのみ（インラインスタイル禁止）
- any 禁止、unknown を使用
- Server Actions は src/lib/actions/ に配置
- Prisma クライアントは src/lib/db.ts から import
- コメントは日本語で記述

## 設計方針
- Server Components をデフォルトで使用、必要な場合のみ "use client"
- データ取得は Server Components で直接 Prisma を呼ぶ
- データ変更は Server Actions 経由
- フォームバリデーションは Zod スキーマで統一
- 1ファイル = 1コンポーネント

## UI実装ルール
- onClick は `onClick={() => handleXxx()}` で統一
- ボタン配置: 左=非破壊（キャンセル/閉じる）、右=主要アクション（保存/登録）
- 非破壊ボタン: shadcn/ui `variant="outline"`
- 破壊的ボタン（削除等）: shadcn/ui `variant="destructive"`
- 破壊的操作は必ず確認ダイアログを出す
- 処理中はボタンを disabled にする（二重送信防止）
- ボタンラベル: モード切替は名詞形（「編集」）、実行は動詞形（「保存する」）

## 開発スタイル（人間との協働ルール）
- オーバーエンジニアリングはしない。MVP に必要十分な実装を心がける
- 編集を提案する前に、必ず関連するファイルを読み込んで理解すること
- 修正時は before/after のコード比較を提示すること
- 一度に大量の修正をしない。優先度をつけて段階的に進める（最大3箇所）
- 修正理由を「なぜ問題か」「放置するとどうなるか」で説明すること
- 使用頻度の低い技術の深掘りはしない

## よく遭遇するエラーと対策
- `next/router` ではなく `next/navigation` を使う（App Router）
- Prisma のカラム名は camelCase（Supabase の snake_case とは異なる）
- フォームのチェックボックスは `checked` 属性を使う（`value` ではない）

## Git コミットメッセージ規約
- feat: 新機能追加
- fix: バグ修正
- docs: ドキュメント変更
- style: フォーマット修正
- refactor: 機能変更なしの改善
- test: テスト追加・修正
- chore: 環境・依存管理

## ドキュメント命名規約
- ドキュメントは `docs/XX_ドキュメント名_vN_M.md` 形式で命名
- XX: 連番（01, 02, 03...）
- vN_M: バージョン（v1_0 = 初版, v1_1 = 改訂）
- 設計書一覧:
  - docs/01_要件定義書_v1_0.md（要件・仕様）
  - docs/02_DB設計書_v1_0.md（Phase 1で作成）
  - docs/03_画面設計書_v1_0.md（Phase 2〜4で作成）
  - docs/04_テスト計画書_v1_0.md（Phase 7で作成）

## フェーズ管理
- 現在のフェーズは docs/progress.md で管理
- 各Phase完了時は必ずコミット＆プッシュ (`git push origin main`)
- 完了基準を満たしてからコミットすること

## カスタムスキル
- `.claude/skills/learning-tracker-SKILL.md` — 学習記録・振り返り用スキル
- `.claude/skills/code-review-SKILL.md` — 汎用コードレビュースキル
- `.claude/skills/react-code-review-SKILL.md` — kakeibo-app 専用 React コードレビュースキル

## 注意事項
- .env.local は絶対にコミットしない
- prisma/dev.db（SQLiteファイル）はコミットしない
- node_modules/ はコミットしない
