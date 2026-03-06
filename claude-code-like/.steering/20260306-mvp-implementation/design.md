# 設計

## 実装方針
- 3 Phase に分割（基盤 → コアツール → 拡張機構）
- 各タスクでテストも同時に書く
- ESM (.js 拡張子インポート), strict mode 遵守

## 設計上の重要決定

1. **Write ツールの条件付き確認**: handler 内で `existsSync` チェック → confirm コールバック呼び出し
2. **Bash は常時確認**: `requiresConfirmation: true`
3. **遅延読み込み**: CommandLoader/SkillLoader/AgentLoader は初回使用時にファイル読み込み
4. **SubAgent の例外的依存**: `tools/sub-agent.ts` → `agent/agent-loop.ts`
5. **会話履歴永続化**: MVP スコープ外（E-01）。インメモリ messages 配列のみ
6. **テストの API モック**: 全テストでモック Provider 使用。実 API は呼ばない

## アーキテクチャ
docs/architecture.md に準拠。4 層レイヤードアーキテクチャ:
- CLI → Agent → Tools → Provider
