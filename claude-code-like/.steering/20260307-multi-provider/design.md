# 設計: マルチプロバイダー対応

## アプローチ

### 1. 型の抽象化

Anthropic SDK の型 (`MessageStream`, `ContentBlock`, `ToolUseBlock` 等) を自前の汎用型に置き換える。

- `MessageStream` → `LLMResponse` (同期レスポンス)
- `Anthropic.ContentBlock` → `TextBlock | ToolUseBlock` (discriminated union)
- `Anthropic.MessageParam` → 自前の `MessageParam`
- 各プロバイダーが `Provider` インターフェースの `createMessage()` を実装し、内部で SDK 固有の型変換を行う

### 2. プロバイダー実装

| プロバイダー | SDK | ファイル |
|-------------|-----|---------|
| Anthropic | @anthropic-ai/sdk | `src/providers/anthropic.ts` |
| Gemini | @google/genai | `src/providers/gemini.ts` |
| Groq / OpenRouter | openai | `src/providers/openai-compatible.ts` |

### 3. ProviderFactory の拡張

- `PROVIDERS` 配列でプロバイダー定義を一元管理
- 環境変数による優先順位自動検出: ANTHROPIC > GEMINI > GROQ > OPENROUTER
- `config.provider` 明示指定時はそのプロバイダーを使用
- `config.model` 未指定時 (`''`) はプロバイダーのデフォルトモデルを使用

### 4. CLI 変更

- `displayWelcome()` にプロバイダー名・モデル名を引数追加
- `confirm.ts` を `repl.ts` に統合 (readline の stdin 競合回避)
- `/exit`, `/quit` コマンド対応

### 5. メッセージ変換

各プロバイダーが `convertMessages()` で汎用 `MessageParam[]` を SDK 固有の形式に変換:
- Gemini: `Content[]` (role: 'model', `functionCall`/`functionResponse`)
- OpenAI互換: `ChatCompletionMessageParam[]` (role: 'tool', `tool_calls`)
