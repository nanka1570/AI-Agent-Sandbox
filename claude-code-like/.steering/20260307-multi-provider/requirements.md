# 要求内容: マルチプロバイダー対応

## 背景

claude-code-like は当初 Anthropic API 専用で設計されていたが、Gemini・Groq・OpenRouter 等の LLM プロバイダーにも対応し、ユーザーが手持ちの API キーで利用できるようにする。

## 要求

1. Provider インターフェースを Anthropic SDK 依存から汎用型に抽象化する
2. Gemini (Google GenAI SDK) プロバイダーを追加する
3. OpenAI 互換 API (Groq, OpenRouter) プロバイダーを追加する
4. 環境変数による自動検出 + 明示指定の両方に対応する
5. CLI にプロバイダー名・モデル名を表示する
6. 既存テストを新しい型に対応させ、新プロバイダーのテストを追加する
7. 設計書を更新する

## 受け入れ基準

- 全94テストが pass する
- 型チェックが pass する
- ANTHROPIC_API_KEY / GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY のいずれかで起動できる
