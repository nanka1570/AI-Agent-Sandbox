# タスクリスト: マルチプロバイダー対応

## フェーズ1: 型の抽象化

- [x] `src/types/provider.ts` を Anthropic SDK 依存から汎用型に書き換え
- [x] `MessageStream` → `LLMResponse` に変更
- [x] `ContentBlock` を自前の `TextBlock | ToolUseBlock` に変更
- [x] `MessageParam`, `ToolResultBlockParam` を自前定義に変更
- [x] `src/types/index.ts` の re-export を更新
- [x] `isToolResultArray` 型ガードを `types/provider.ts` に一元定義

## フェーズ2: プロバイダー実装

- [x] `src/providers/anthropic.ts` を新しい `Provider` インターフェースに対応
- [x] `src/providers/gemini.ts` を新規作成 (Google GenAI SDK)
- [x] `src/providers/openai-compatible.ts` を新規作成 (OpenAI SDK)
- [x] `src/providers/provider-factory.ts` を拡張 (4プロバイダー対応 + 自動検出)
- [x] `src/types/config.ts` に `ProviderName` 型追加、`DEFAULT_CONFIG.model` を空文字に変更

## フェーズ3: CLI 改善

- [x] `src/cli/display.ts` の `displayWelcome()` にプロバイダー名・モデル名表示を追加
- [x] `src/index.ts` で `ProviderFactory.create()` の戻り値を `ProviderInfo` に対応
- [x] `src/cli/confirm.ts` を削除し、`src/cli/repl.ts` に統合 (stdin 競合回避)
- [x] `/exit`, `/quit` コマンド対応を追加

## フェーズ4: エージェントループ対応

- [x] `src/agent/agent-loop.ts` のエラーハンドリングをプロバイダー非依存に変更
- [x] `status` / `statusCode` 両方に対応するエラー判定に修正

## フェーズ5: テスト

- [x] `tests/helpers/mock-provider.ts` を新規作成
- [x] `tests/unit/providers/gemini.test.ts` を新規作成
- [x] `tests/unit/providers/openai-compatible.test.ts` を新規作成
- [x] `tests/unit/providers/provider-factory.test.ts` を新規作成
- [x] 既存テストを新しい型 (`LLMResponse`) に対応

## フェーズ6: ドキュメント更新

- [x] `docs/architecture.md` テクノロジースタック・レイヤー図・依存図を更新
- [x] `docs/functional-design.md` mermaid 図を更新
- [x] `docs/` 全体の「Anthropic のみ」記述を更新

---

## 実装後の振り返り

- **実装完了日**: 2026-03-07
- **計画と実績の差分**: ステアリングファイルなしで実装が先行し、事後的に作成。フェーズ6の docs/ 全体更新は `/apply-fixes` でレビュー指摘をきっかけに実施。
- **学んだこと**: マルチプロバイダー対応では、メッセージ変換ロジック (`convertMessages`) が各プロバイダーで最も複雑な部分。特に Gemini の `functionCall`/`functionResponse` と OpenAI の `tool_calls`/`tool` role の違いが大きい。
- **次回への改善提案**: 型の抽象化を先に設計書に反映してから実装すべきだった。ステアリングファイルを事前に作成することで、型変更の影響範囲を漏れなく把握できたはず。
