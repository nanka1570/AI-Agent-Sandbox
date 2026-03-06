# claude-code-like プロジェクト設定

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| 言語 | TypeScript (strict mode) |
| ランタイム | Node.js 22+ |
| AI SDK | @anthropic-ai/sdk |
| CLI 入力 | node:readline/promises |
| 出力装飾 | chalk v5 |
| Markdown | marked + marked-terminal |
| スピナー | ora |
| Glob | fast-glob |
| diff 表示 | diff |
| テスト | Vitest |
| ビルド | tsup |
| 開発環境 | Dev Container (Node.js 22) |

## CLI アーキテクチャルール

### モジュール構成

- ESM (type: module) で統一
- エントリーポイント: `src/index.ts`
- ツール定義: `src/tools/` 配下に1ツール1ファイル
- ツールスキーマは Anthropic Tool Use 形式で定義

### Tool Use ループ

- ユーザー入力 → API 呼び出し → ツール実行 → 結果フィードバック → 再度 API 呼び出し ... のループ
- `stop_reason === "end_turn"` でループ終了
- `stop_reason === "tool_use"` でツール実行→結果を messages に追加→再呼び出し

### 確認プロンプト

- Write（既存ファイル上書き時）と Bash は実行前にユーザー確認
- Read / Glob / Grep は確認なしで自動実行

### エラーハンドリング

- ツール実行エラーは `is_error: true` で API に返却
- API エラー（レート制限等）はリトライ or ユーザーに通知

## テスト規約

- 単体テスト: Vitest
- テストファイル: `tests/**/*.test.ts`（`tests/unit/`, `tests/integration/`, `tests/e2e/` に配置）
- テストラベルは日本語で記述

## 注意事項

- このファイルはプロジェクト固有のルールのみ記載
- スペック駆動開発の基本ルール、ディレクトリ構造、開発プロセスは `~/.claude/CLAUDE.md`（グローバル設定）を参照
