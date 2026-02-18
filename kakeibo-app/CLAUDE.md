# 家計簿アプリ (kakeibo-app) プロジェクトルール

グローバル設定（~/.claude/CLAUDE.md）の共通ルールに加え、本プロジェクト固有のルールを以下に記載する。

## 技術スタック
- Next.js 16 (App Router) + TypeScript 5 (strict)
- UI: Tailwind CSS v4 + shadcn/ui
- DB: Prisma 7 + SQLite（MVP）→ Supabase PostgreSQL（Phase B）
- チャート: Recharts
- 日付: date-fns
- フォーム: React Hook Form + Zod
- テスト: Vitest + React Testing Library + Playwright
- リンター: ESLint + Prettier

## ビルド・テストコマンド
- 開発サーバー: `npm run dev`
- ビルド: `npm run build`
- テスト: `npm run test`
- テスト(ウォッチ): `npm run test:watch`
- テスト(カバレッジ): `npm run test:coverage`
- リント: `npm run lint`
- フォーマット: `npx prettier --write .`
- 型チェック: `npx tsc --noEmit`
- Prisma マイグレーション: `npx prisma migrate dev`
- Prisma Studio: `npx prisma studio`
- E2E テスト: `npx playwright test`

## プロジェクト固有の規約
- Server Actions は src/lib/actions/ に配置
- Prisma クライアントは src/lib/db.ts から import
- データ取得は Server Components で直接 Prisma を呼ぶ
- フォームバリデーションは Zod スキーマで統一

## よく遭遇するエラーと対策
- `next/router` ではなく `next/navigation` を使う（App Router）
- Prisma のカラム名は camelCase（Supabase の snake_case とは異なる）
- フォームのチェックボックスは `checked` 属性を使う（`value` ではない）
- Prisma v7 は `new PrismaClient()` に adapter が必須。`@prisma/adapter-better-sqlite3` を使う
- Prisma v7 の import は `@/generated/prisma/client` から行う（`@prisma/client` ではない）

## ドキュメント命名規約
- ドキュメントは `docs/XX_ドキュメント名_vN_M.md` 形式で命名
- XX: 連番（01, 02, 03...）
- vN_M: バージョン（v1_0 = 初版, v1_1 = 改訂）
- 設計書一覧（8文書体系）:
  - docs/01_要件定義書_v1_0.md（要件・仕様）
  - docs/02_基本設計書_v1_0.md（システム構成・URL設計・API一覧）
  - docs/03_DB設計書_v1_0.md（テーブル定義・Prismaスキーマ）
  - docs/04_画面設計書_v1_0.md（画面遷移・ワイヤーフレーム・UI部品）
  - docs/05_詳細設計書_v1_0.md（各機能の項目定義・動作仕様・バリデーション）
  - docs/06_テスト計画書_v1_0.md（テスト方針・種類・環境・スコープ）
  - docs/07_テスト仕様書_v1_0.md（全テストケース一覧）
  - docs/08_テスト結果報告書_v1_0.md（テスト実行結果・不具合一覧）

## フェーズ管理
- 現在のフェーズは docs/progress.md で管理
- 各Phase完了時は必ずコミット＆プッシュ (`git push origin main`)
- 完了基準を満たしてからコミットすること
- 厳密ウォーターフォール: 全設計 → 全実装 → 全テスト の順序を厳守

## カスタムスキル
- `.claude/skills/learning-tracker/SKILL.md` — 学習記録・振り返り用スキル
- `.claude/skills/code-review/SKILL.md` — 汎用コードレビュースキル
- `.claude/skills/react-code-review/SKILL.md` — kakeibo-app 専用 React コードレビュースキル

## 注意事項
- .env.local は絶対にコミットしない
- dev.db（SQLiteファイル）はコミットしない
- node_modules/ はコミットしない
