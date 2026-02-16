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

## 注意事項
- .env.local は絶対にコミットしない
- prisma/dev.db（SQLiteファイル）はコミットしない
- node_modules/ はコミットしない
