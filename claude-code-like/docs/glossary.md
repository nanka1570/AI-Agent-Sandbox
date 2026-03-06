# プロジェクト用語集 (Glossary)

## 概要

このドキュメントは、claude-code-like プロジェクトで使用される用語の定義を管理します。

**更新日**: 2026-03-06

## ドメイン用語

### エージェントループ (Agent Loop)

**定義**: ユーザー入力 → API 呼び出し → ツール実行 → 結果フィードバック → 再呼び出し... を繰り返す制御ループ

**説明**: AI が `end_turn` を返すまで、`tool_use` → ツール実行 → `tool_result` のサイクルを自動的に繰り返す。これにより AI が自律的に複数のツールを連鎖実行できる。

**関連用語**: Tool Use, ツールディスパッチャー, AgentLoop, ConversationContext

### REPL

**定義**: Read-Eval-Print Loop の略。ユーザーの入力を受け取り、処理し、結果を表示するループ

**説明**: 本プロジェクトでは `node:readline/promises` を使用した対話型入力ループを指す。`exit` / `quit` で終了、`Ctrl+C` で応答中断。概念としての REPL に対し、その実装クラスが `Repl`（`src/cli/repl.ts`）である。

**関連用語**: エージェントループ, Repl

### Repl

**定義**: CLI レイヤーのメインコンポーネント。CLI 引数の解析、ユーザー入力の受付、コマンド判定、特殊入力処理を担当するクラス

**説明**: `ReplOptions`（`resumeId`, `listConversations`, `debug` フィールド）を受け取ってインスタンス化する。`start()` でループ開始、`handleInput()` でコマンド/通常入力の振り分け、`handleInterrupt()` で Ctrl+C 処理を行う。配置先: `src/cli/repl.ts`。

**関連用語**: REPL, ReplOptions, コマンドローダー, エージェントループ, ConversationStore

### ReplOptions

**定義**: Repl クラスのコンストラクタに渡す設定型。`resumeId`, `listConversations`, `debug` の 3 フィールドを保持する

**説明**: `resumeId` は `--resume` で指定された会話 ID（省略時は最新の会話を自動選択）、`listConversations` は `--list` フラグ、`debug` は `--debug` フラグに対応する。CLI 引数を構造化してアプリケーション内部に渡すための型。

**関連用語**: Repl, デバッグモード, ConversationStore, REPL

### ツール (Tool)

**定義**: AI が自律的に呼び出すことができる機能単位。ファイル操作やシェル実行などの具体的な操作を行う

**説明**: Anthropic の Tool Use 仕様に準拠。`name`, `description`, `input_schema`（JSON Schema）で定義し、AI が判断して呼び出す。本プロジェクトでは Read / Write / Edit / Bash / Glob / Grep / Skill / SubAgent の 8 ツールを実装。

**関連用語**: Tool Use, ツールディスパッチャー, ToolDefinition, ToolSchema

### ToolDefinition

**定義**: ツール1つを表す型。`name`, `description`, `input_schema`, `handler`, `requiresConfirmation` を保持する

**説明**: AI への公開用スキーマ（`ToolSchema`）と実行関数（`handler`）を一体で管理する内部表現。`input_schema` は `Record<string, unknown>` 型の JSON Schema 形式で、AI がツールに渡すパラメータ構造を定義する。`ToolDispatcher.register()` に渡すことでツールを登録できる。API 送信時は `handler` を除いた `ToolSchema` 形式に変換する。

**関連用語**: ツール, ToolSchema, ToolResult, ツールディスパッチャー

### ToolResult

**定義**: ツール実行結果を表す型。`content`（結果文字列）と `is_error`（エラーフラグ）を持つ

**説明**: `content` は AI へ返却するテキスト。`is_error: true` の場合、AI はエラーとして受け取り代替手段を検討してループを継続する（エラー時もエージェントループを終了しない点が重要）。`ToolDispatcher.dispatch()` の戻り値型。

**関連用語**: ツール, ToolDefinition, ツールディスパッチャー, エージェントループ

### ToolSchema

**定義**: Anthropic Tool Use API に送信する形式に変換されたツール定義。`name`, `description`, `input_schema` のみを含む

**説明**: `ToolDefinition` から `handler` と `requiresConfirmation` を除いたもの。`ToolDispatcher.getToolSchemas()` で取得し、API リクエストの `tools` フィールドに渡す。

**関連用語**: ToolDefinition, Tool Use, ツールディスパッチャー, CreateMessageParams

### ツールディスパッチャー (ToolDispatcher)

**定義**: AI が要求したツール名を受け取り、対応するハンドラー関数にルーティングするコンポーネント

**説明**: `register(tool: ToolDefinition)` でツールを登録し、`dispatch(name, input)` でハンドラーを呼び出す。`requiresConfirmation: true` のツールでは dispatch 前に確認プロンプトを表示する。`getToolSchemas()` で API 送信用の ToolSchema 配列を返す。配置先: `src/agent/tool-dispatcher.ts`。

**関連用語**: ツール, エージェントループ, ToolDefinition, ToolSchema

### コマンド (Command)

**定義**: `.commands/*.md` ファイルで定義される、`/コマンド名` で実行できる定型作業の手順書

**説明**: YAML frontmatter（`description`, `allowed-tools`）と Markdown 本文で構成。実行時にコマンド内容がシステムプロンプトに注入され、AI がその手順に従って作業する。`allowed-tools` は現在宣言のみで制限機能は未実装（将来対応の拡張ポイント）。

**使用例**:
- `/add-feature ユーザー管理` → add-feature.md の手順に従って機能実装
- `/help` → 利用可能なコマンド一覧を表示

**関連用語**: スキル, YAML Frontmatter, コマンドローダー, CommandDefinition

### コマンドローダー (CommandLoader)

**定義**: `.commands/` ディレクトリからコマンド定義を読み込み、`/コマンド名` 入力を解決してコマンド実行フローに接続するコンポーネント

**説明**: `loadCommands(dirs: string[])` でコマンド定義を読み込み、`resolve(input)` でコマンド名を解決する。`/help` はビルトインコマンドとして特別扱いし（`isBuiltinCommand()` で判定）、`resolve()` は `null` を返す。YAML frontmatter の `allowed-tools` フィールドは現在宣言のみ保持し、ツール使用制限は未実装（将来の拡張ポイント）。遅延読み込み: 初回 `/コマンド名` 解決時に REPL から呼び出す。起動時にはロードしない。配置先: `src/loaders/command-loader.ts`。

**関連用語**: コマンド, CommandDefinition, YAML Frontmatter, エージェントループ

### CommandDefinition

**定義**: コマンド1つを表す型。`name`, `description`, `allowedTools`, `body`, `filePath` を保持する

**説明**: `.commands/*.md` の YAML frontmatter と Markdown 本文をパースした結果を格納する。`body` がシステムプロンプトに注入される手順書本文。`allowedTools` は宣言のみで実際の制限機能は未実装。

**関連用語**: コマンド, コマンドローダー, YAML Frontmatter

### スキル (Skill)

**定義**: `.skills/[name]/SKILL.md` で定義される、AI の振る舞いを特定のドメイン知識やテンプレートで拡張する仕組み

**説明**: `Skill('name')` で AI が呼び出す。SKILL.md（ガイド）+ template.md + 追加ファイルで構成。コマンドが「ユーザーが起動する定型作業」であるのに対し、スキルは「AI が必要に応じて呼び出す知識パック」。

**使用例**:
- `Skill('code-review')` → コードレビューのチェックリストとガイドを読み込み

**関連用語**: コマンド, サブエージェント, スキルローダー, SkillDefinition

### スキルローダー (SkillLoader)

**定義**: `.skills/*/SKILL.md` を読み込み、スキル名からスキル定義を解決するコンポーネント

**説明**: `loadSkills(dirs: string[])` でスキル定義を読み込み、`resolve(name)` で SkillDefinition を返す。SKILL.md（ガイド）+ template.md + 追加ファイルをバンドルして保持する。遅延読み込み: `Skill('name')` 呼び出し時に初めてファイルを読み込む（起動時にはロードしない）。配置先: `src/loaders/skill-loader.ts`。

**関連用語**: スキル, SkillDefinition, サブエージェント

### SkillDefinition

**定義**: スキル1つを表す型。`name`, `description`, `guide`, `template`, `additionalFiles`, `dirPath` を保持する

**説明**: `.skills/[name]/SKILL.md` の YAML frontmatter と本文をパースした結果を格納する。`guide` が SKILL.md 本文、`template` が template.md の内容（省略可）、`additionalFiles` がその他のファイルを Map で保持する。

**関連用語**: スキル, スキルローダー

### サブエージェント (SubAgent)

**定義**: メインの会話コンテキストとは独立した messages 配列で動作する、ツール使用を制限されたエージェント

**説明**: `.agents/[name].md` で定義。YAML frontmatter の `tools` フィールドで使用可能ツールを制限し、最小権限の原則を適用。メイン会話を中断せずに並行タスク（コードレビュー、テスト等）を委譲できる。配置先: `src/tools/sub-agent.ts`。

**関連用語**: エージェントループ, スキル, AgentDefinition

### AgentDefinition

**定義**: サブエージェント1つを表す型。`name`, `description`, `tools`, `model`, `instructions`, `filePath` を保持する

**説明**: `.agents/[name].md` の YAML frontmatter と Markdown 本文をパースした結果を格納する。`tools` で使用可能ツールを制限する。`model` はオプションで、指定時はメインとは異なるモデルでサブエージェントを実行できる。

**関連用語**: サブエージェント, 最小権限の原則, AgentLoader

### AgentLoader

**定義**: `.agents/*.md` を読み込み、エージェント名からエージェント定義を解決するコンポーネント

**説明**: `loadAgents(dirs: string[])` でエージェント定義を読み込み、`resolve(name)` で AgentDefinition を返す。SkillLoader・CommandLoader と同じローダーパターンを採用。遅延読み込み: SubAgent ツール呼び出し時に初めてファイルを読み込む（起動時にはロードしない）。配置先: `src/loaders/agent-loader.ts`。

**関連用語**: サブエージェント, AgentDefinition, スキルローダー

### フロントマターパーサー (FrontmatterParser)

**定義**: `.commands/`, `.skills/`, `.agents/` の各定義ファイルから YAML frontmatter を解析する共通パーサー関数

**説明**: `parseFrontmatter(content: string)` 関数を提供し、コマンドローダー・スキルローダー・AgentLoader が共通利用する。責務の重複を避けるため YAML frontmatter の解析ロジックをこのモジュールに一元化する。配置先: `src/loaders/frontmatter.ts`。

**関連用語**: YAML Frontmatter, コマンドローダー, スキルローダー, AgentLoader

### ディスプレイ (Display)

**定義**: CLI レイヤーの出力フォーマットコンポーネント。Markdown レンダリング、カラー出力、スピナー表示を担当する

**説明**: `chalk` でカラーコーディング、`marked` + `marked-terminal` で Markdown レンダリング、`ora` でスピナー表示を行う。配置先: `src/cli/display.ts`。

**関連用語**: Repl, 確認プロンプト, chalk, marked / marked-terminal, ora

### システムプロンプト (System Prompt)

**定義**: AI への基本的な振る舞い指示。ベースプロンプト + CLAUDE.md の内容で構成

**説明**: CLAUDE.md が存在する場合はその内容を注入。コマンド実行時はコマンド内容も追加される。AI のロール定義、ツール使用方針、プロジェクト固有ルールを含む。

**関連用語**: CLAUDE.md, コマンド, SystemPromptManager

### SystemPromptManager

**定義**: システムプロンプトを動的に組み立てるコンポーネント

**説明**: `build(options?: { command?: CommandDefinition; skill?: SkillDefinition })` で基本プロンプト + CLAUDE.md の内容を結合したシステムプロンプト文字列を生成する。コマンド実行時は `options.command` として渡すとコマンド本文を追加注入する。`options.skill` は将来のシステムプロンプト注入方式への切り替えに備えた予約フィールドであり、現在は未使用（渡されても無視される。スキルはツール結果としてコンテキストに追加される方式を採用）。組み立て順: (1) 基本システムプロンプト → (2) CLAUDE.md → (3) command.body。ファイルシステムのみに依存し、他レイヤーへの依存はない。配置先: `src/agent/system-prompt.ts`。

**関連用語**: システムプロンプト, CLAUDE.md, コマンド, スキル（将来対応・現在未使用）

### CLAUDE.md

**定義**: プロジェクトルートに配置する設定ファイル。プロジェクト固有のルールやコンテキストを AI に伝える

**説明**: CLI 起動時に自動読み込みされ、システムプロンプトに注入される。技術スタック、コーディング規約、アーキテクチャルールなどを記述する。

**関連用語**: システムプロンプト

### YAML Frontmatter

**定義**: Markdown ファイルの先頭に `---` で囲んで記述する YAML メタデータブロック

**説明**: コマンド、スキル、エージェント定義ファイルで `description`, `tools`, `allowed-tools` 等のメタデータを格納する。`yaml` ライブラリでパースする。実装上は `src/loaders/frontmatter.ts` の共通パーサー関数を経由する。CommandLoader、SkillLoader、AgentLoader はこの共通モジュールを再利用する。

**使用例**:
```yaml
---
description: コードレビューを行うエージェント
tools: Read, Glob, Grep
---
```

**関連用語**: コマンド, スキル, サブエージェント

### Provider

**定義**: API 通信を抽象化するインターフェース。Anthropic API への直接通信をデフォルト実装とし、将来の Bedrock 対応に備える

**説明**: `createMessage(params: CreateMessageParams)` でストリーミングレスポンスを返却。メッセージ形式の変換は Provider 側に持たせる。配置先: `src/providers/provider.ts`（インターフェース定義）。

**関連用語**: AnthropicProvider, ストリーミング, CreateMessageParams

### ConversationContext

**定義**: 一つの会話セッションを管理するデータ構造。messages 配列、システムプロンプト、ツール定義を保持する

**説明**: エージェントループが API を呼び出す際に参照するコンテキスト全体を表す。メイン会話とサブエージェントはそれぞれ独立した ConversationContext を持つ。ランタイムのみで使用される揮発的なデータ構造であり、永続化は ConversationStore が扱う ConversationRecord が担う。配置先（型定義）: `src/types/conversation.ts`。

**関連用語**: エージェントループ, システムプロンプト, ツール, ConversationRecord

### ConversationRecord

**定義**: 会話履歴の永続化単位。ID、サマリー（最初のユーザーメッセージ）、messages 配列、タイムスタンプ（createdAt / updatedAt、ISO 8601 形式）を保持する

**説明**: `~/.claude-code-like/conversations/[uuid].json` に保存される。`--resume` で復元、`--list` で一覧表示に使用。ランタイムの ConversationContext を永続化フォーマットに変換したもの。再開時（`--resume`）に ConversationContext として復元される。配置先（型定義）: `src/types/conversation.ts`。

**関連用語**: ConversationContext, ConversationStore

### AnthropicProvider

**定義**: Provider インターフェースの標準実装。Anthropic API へ直接通信し、ストリーミングレスポンスを返却する

**説明**: `@anthropic-ai/sdk` を使用して Anthropic API に接続する。API キーは `ANTHROPIC_API_KEY` 環境変数から取得。`ProviderFactory.create()` によってインスタンス化され、エージェントレイヤーに注入される。配置先: `src/providers/anthropic.ts`。

**関連用語**: Provider, ストリーミング, ProviderFactory

### AppConfig

**定義**: アプリケーション設定を保持する型。`model`, `maxTokens`（デフォルト: 8192）, `timeout`（デフォルト: 120）, `theme`（`'default' | 'dark' | 'light'`、デフォルト: `'default'`）等を含む

**説明**: `model` のデフォルト値は `claude-sonnet-4-20250514`（2026-03-06 時点のデフォルト。Anthropic API 向けモデルID形式）。Bedrock 利用時は BedrockProvider 内で Bedrock 形式に変換するため、AppConfig 側では常に Anthropic 形式で保持する。`~/.claude-code-like/config.json` から読み込み。未設定時はデフォルト値を使用。`provider` フィールドで Provider の切り替えが可能（現在は `'anthropic'` のみ対応、将来 Bedrock 等を追加予定）。

**関連用語**: Provider, ProviderFactory

### ProviderFactory

**定義**: AppConfig の `provider` フィールドに応じて適切な Provider インスタンスを生成するファクトリークラス

**説明**: `ProviderFactory.create(config)` を呼び出すと、設定に応じて AnthropicProvider 等のインスタンスを返す。将来 Bedrock 対応する際に新規 Provider を追加する拡張ポイント。配置先: `src/providers/provider-factory.ts`。

**関連用語**: Provider, AnthropicProvider, AppConfig

### CreateMessageParams

**定義**: `Provider.createMessage()` に渡すパラメータ型。`messages`, `system`, `tools`, `maxTokens` を含む

**説明**: エージェントレイヤーが API 呼び出し時に組み立てるリクエスト構造。`ToolSchema[]` 形式のツール定義と、ConversationContext の `messages` 配列を渡す。配置先（型定義）: `src/types/provider.ts`。

**関連用語**: Provider, ConversationContext, ToolSchema

### ConversationStore

**定義**: 会話履歴の保存・復元・一覧表示を管理するコンポーネント

**説明**: `~/.claude-code-like/conversations/[uuid].json` にファイルとして永続化する。保存タイミングは3つ: (1) 正常終了時（exit/quit）、(2) ターン完了ごと（end_turn 後に上書き保存）、(3) 異常終了時（SIGINT/SIGTERM シグナルハンドラーで即時保存）。`list()` は `updatedAt` 降順で `Pick<ConversationRecord, 'id' | 'summary' | 'createdAt' | 'updatedAt'>[]` を返す（`--list` 表示用）。`~/.claude-code-like/` ディレクトリのパーミッションは 700（所有者のみアクセス可）に設定する。パフォーマンス要件の詳細は `docs/architecture.md` の「スケーラビリティ設計 - 会話データの増加」セクションを参照。配置先: `src/agent/conversation-store.ts`。

**関連用語**: ConversationRecord, ConversationContext

### AgentLoop

**定義**: エージェントレイヤーのメインコンポーネント。API 呼び出し → ツール実行 → 結果フィードバックのループを制御するクラス

**説明**: `run(userMessage, context)` でループを開始し、`processStream()` でストリーミングレスポンスを処理する。`handleToolUse()` が ToolDispatcher に dispatch し、`tool_result` を messages に追加して再呼び出しする。Ctrl+C 中断は AbortController 経由で `processStream()` 内で検知する。配置先: `src/agent/agent-loop.ts`。

**関連用語**: エージェントループ, ConversationContext, ToolDispatcher, Provider, ConversationStore

### StopReason

**定義**: Anthropic API がメッセージ生成を終了した理由を示す値

| 値 | 意味 |
|----|------|
| `end_turn` | AI が応答を完了。エージェントループを終了し、次のユーザー入力を待つ |
| `tool_use` | AI がツール呼び出しを要求。ツールを実行し結果を返して再度 API を呼び出す |
| `max_tokens` | 最大トークン数に達した。応答が途中で切れている可能性がある。エージェントループを終了し、ユーザーに通知して次の入力を待つ（表示文言は functional-design.md のエラーハンドリング表を正とする） |

**関連用語**: エージェントループ, Tool Use, AppConfig

### レイヤードアーキテクチャ (Layered Architecture)

**定義**: 本プロジェクトのアーキテクチャパターン。CLI / エージェント / ツール / プロバイダーの 4 層に責務を分離する

**説明**: 依存は上位レイヤーから下位レイヤーへの一方向のみ許可。逆方向の依存は禁止（sub-agent.ts の再帰呼び出しは意図的な例外）。詳細な依存方向と各レイヤーの許可・禁止操作は `docs/architecture.md` を参照。

**関連用語**: Provider, サブエージェント, ツール

### 最小権限の原則 (Principle of Least Privilege)

**定義**: 各コンポーネントが動作に必要な最小限の権限のみを持つべきとするセキュリティ原則

**説明**: サブエージェントの `tools` フィールドで使用可能ツールを明示的に制限することで実現する。例えばコードレビューエージェントには Read / Glob / Grep のみを許可し、Write / Bash は付与しない。

**関連用語**: サブエージェント, YAML Frontmatter

### デバッグモード (Debug Mode)

**定義**: `--debug` フラグで起動時に有効化される API 通信ログ記録モード

**説明**: 全 API リクエスト・レスポンスを `~/.claude-code-like/logs/[YYYY-MM-DD].jsonl` にローカル記録する。JSONL 形式（1リクエスト1行）を採用。API キー等のセンシティブ情報は `ANTH****` 形式にマスキングして記録する。書き込みは非同期で行い、メイン処理のパフォーマンスに影響を与えない。セキュリティ管理者による事後監査を可能にする目的で設計された。

**関連用語**: AppConfig, AnthropicProvider, ReplOptions

### 確認プロンプト (Confirmation Prompt)

**定義**: 危険な操作（Bash 実行、既存ファイル上書き）の前にユーザーに y/n で確認を求める仕組み

**説明**: `ToolDefinition.requiresConfirmation` が `true` のツールで表示。ユーザーが拒否した場合、`is_error: true` で AI にフィードバックし、AI が代替案を検討して処理を継続する（エージェントループは終了しない）。配置先: `src/cli/confirm.ts`。

**関連用語**: ツール, ToolDefinition, ToolResult, エージェントループ, ディスプレイ

## 技術用語

### Tool Use (Function Calling)

**定義**: AI モデルが応答の中でツール（関数）の呼び出しを要求する仕組み

**説明**: Anthropic API の機能。`stop_reason: "tool_use"` で AI がツール呼び出しを要求し、実行結果を `tool_result` として返すと AI が処理を継続する。

**本プロジェクトでの用途**: エージェントループの中核メカニズム

**関連用語**: エージェントループ, StopReason, ToolSchema

### ストリーミング (Streaming)

**定義**: API レスポンスをトークン単位で逐次受信し、リアルタイムに表示する方式

**説明**: Anthropic SDK の `stream` パラメータを使用。`text_delta` イベントでトークンを逐次受信して即座に表示する。ツール呼び出しブロック（`tool_use`）はストリーム完了後に確定するため、ツール実行はストリーム終了を待ってから行う。

**本プロジェクトでの用途**: AI 応答のリアルタイム表示

**関連用語**: Provider, AnthropicProvider, エージェントループ

### node:readline/promises

**定義**: Node.js 標準ライブラリの対話型入力モジュール。Promise ベースの非同期 readline インターフェースを提供する

**本プロジェクトでの用途**: REPL の対話型入力受付（ユーザープロンプト表示・行入力・Ctrl+C 検知）。外部依存なしで実現できる点が採用理由

**関連用語**: REPL, Repl, 確認プロンプト

### @anthropic-ai/sdk

**定義**: Anthropic が提供する公式 TypeScript/JavaScript SDK

**本プロジェクトでの用途**: Claude API との通信、メッセージ送信、ストリーミング処理、Tool Use の型定義

**関連用語**: AnthropicProvider, Provider

### chalk

**定義**: ターミナル文字列のカラー出力ライブラリ。ESM ネイティブ対応

**本プロジェクトでの用途**: ツール名、ファイルパス、エラーメッセージ、確認プロンプトの色分け表示

**関連用語**: ディスプレイ

### marked / marked-terminal

**定義**: Markdown パーサー（marked）とターミナル向けレンダラー（marked-terminal）

**本プロジェクトでの用途**: AI 応答の Markdown をターミナルに適した形式でレンダリング

**関連用語**: ディスプレイ

### ora

**定義**: ターミナル向けスピナー表示ライブラリ。ESM 対応

**本プロジェクトでの用途**: AI 思考中・ストリーミング待機中のスピナー表示による UX 向上

**関連用語**: ディスプレイ

### fast-glob

**定義**: 高速な glob パターンマッチングライブラリ

**本プロジェクトでの用途**: Glob ツールのファイルパス検索

**関連用語**: ツール（Glob）

### diff

**定義**: テキスト差分を計算・表示するライブラリ

**本プロジェクトでの用途**: Edit ツールの変更可視化。`old_string` → `new_string` の変更内容をターミナルに差分表示する

**関連用語**: ツール（Edit）

### yaml

**定義**: YAML パーサー・シリアライザーライブラリ

**本プロジェクトでの用途**: コマンド/スキル/エージェント定義ファイルの YAML frontmatter 解析

**関連用語**: YAML Frontmatter, フロントマターパーサー

### tsup

**定義**: TypeScript バンドラー。esbuild ベースで高速にビルド

**本プロジェクトでの用途**: `src/index.ts` を ESM 形式にバンドルし、CLI として配布可能にする

**関連用語**: tsx

### Vitest

**定義**: Vite ベースの高速テストフレームワーク。ESM ネイティブ対応

**本プロジェクトでの用途**: ユニットテスト、統合テスト、E2E テストの実行

**関連用語**: tsup, tsx

### tsx

**定義**: TypeScript を直接実行するランタイムツール。esbuild ベースで高速

**本プロジェクトでの用途**: 開発時の TypeScript 直接実行（`npm run dev` で使用）

**関連用語**: tsup

## 略語一覧

| 略語 | 正式名称 | 説明 |
|------|---------|------|
| REPL | Read-Eval-Print Loop | 対話型入力ループ |
| CLI | Command Line Interface | コマンドラインインターフェース |
| API | Application Programming Interface | アプリケーション間通信の仕様 |
| SDK | Software Development Kit | ソフトウェア開発キット |
| ESM | ECMAScript Modules | JavaScript の標準モジュールシステム |
| MVP | Minimum Viable Product | 実用最小限の製品 |
| UX | User Experience | ユーザー体験 |
| TLS | Transport Layer Security | 通信暗号化プロトコル。Anthropic API との HTTPS 通信で使用 |
| JSONL | JSON Lines | 1 行 1 JSON オブジェクトの形式。API 通信ログの保存フォーマット |
| KPI | Key Performance Indicator | 重要業績評価指標 |
| NDA | Non-Disclosure Agreement | 秘密保持契約。PRD のターゲットユーザー記述で使用 |
| UUID | Universally Unique Identifier | 会話履歴の一意識別子として使用 |
| P0/P1/P2 | Priority 0/1/2 | 機能優先度。P0=MVP 必須、P1=重要、P2=将来対応 |

## 用語分類の基準

- **ドメイン用語**: 本プロジェクト固有の概念・コンポーネント（エージェントループ、コマンド、スキル等）
  - エントリー構成: **定義** + **説明** + **関連用語**（3要素必須）
- **技術用語**: 外部ライブラリ・プロトコル・業界標準の技術（@anthropic-ai/sdk、Vitest 等）
  - プロジェクト固有の概念（Tool Use、ストリーミング）: **定義** + **説明** + **本プロジェクトでの用途** + **関連用語**
  - 外部ライブラリ: **定義** + **本プロジェクトでの用途**（説明は省略。公式ドキュメントを参照。**関連用語**はオプション）
- **略語一覧**: プロジェクト文書内で実際に使用される略語を対象とする
