# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
claude-code-like/
├── src/                          # ソースコード
│   ├── cli/                      # CLI レイヤー
│   ├── agent/                    # エージェントレイヤー
│   ├── tools/                    # ツールレイヤー
│   ├── providers/                # プロバイダーレイヤー
│   ├── loaders/                  # コマンド/スキル/エージェント読み込み
│   ├── types/                    # 型定義
│   └── index.ts                  # CLI エントリーポイント（CLI 引数解析 → Repl 起動。バレルではない）
├── tests/                        # テストコード
│   ├── unit/                     # ユニットテスト
│   ├── integration/              # 統合テスト
│   └── e2e/                      # E2E テスト
├── docs/                         # プロジェクトドキュメント
│   └── ideas/                    # アイデア・調査メモ
├── .commands/                    # ユーザー定義コマンド（プロジェクトローカル。グローバルは ~/.claude/commands/）
├── .skills/                      # ユーザー定義スキル（プロジェクトローカル。グローバルは ~/.claude/skills/）
├── .agents/                      # ユーザー定義エージェント（プロジェクトローカル。グローバルは ~/.claude/agents/）
├── CLAUDE.md                     # プロジェクト設定
├── .editorconfig                 # エディタ共通設定（インデント・文字コード・行末統一）
├── .eslintrc.json                # Lint 設定（MVP では未採用。ESLint 導入時に有効化）
├── package.json                  # パッケージ定義
├── tsconfig.json                 # TypeScript 設定
├── tsup.config.ts                # ビルド設定
├── vitest.config.ts              # テスト設定
└── .gitignore                    # Git 除外設定
```

## ディレクトリ詳細

### src/cli/ (CLI レイヤー)

**役割**: ユーザー入力の受付、コマンド判定、ストリーミング出力の表示

**配置ファイル**:
- `repl.ts`: REPL ループ（readline による入力受付、exit/quit 処理）
- `display.ts`: 出力フォーマット（Markdown レンダリング、カラー出力、スピナー）
- `confirm.ts`: 確認プロンプト（y/n 入力）

**命名規則**: kebab-case、機能名

**依存関係**:
- 依存可能: `agent/`, `loaders/`, `types/`（CommandLoader の実体が `src/loaders/command-loader.ts` に配置されるため `cli/` から `loaders/` を直接参照する）
- 依存禁止: `tools/`, `providers/`

```
cli/
├── repl.ts
├── display.ts
└── confirm.ts
```

### src/agent/ (エージェントレイヤー)

**役割**: Agent ループの制御、ツールディスパッチ、システムプロンプト構築

**配置ファイル**:
- `agent-loop.ts`: メインの Agent ループ（API 呼び出し → ツール実行 → 再呼び出し）
- `tool-dispatcher.ts`: ツール名からハンドラーへのルーティング
- `system-prompt.ts`: システムプロンプトの生成（基本プロンプト + CLAUDE.md）
- `conversation-store.ts`: 会話履歴の保存・復元・一覧表示（E-01）

**命名規則**: kebab-case、機能名

**依存関係**:
- 依存可能: `tools/`, `providers/`, `loaders/`, `types/`
- 依存禁止: `cli/`

```
agent/
├── agent-loop.ts
├── tool-dispatcher.ts
├── system-prompt.ts
└── conversation-store.ts
```

### src/tools/ (ツールレイヤー)

**役割**: 個別ツールの実装。1 ツール 1 ファイル

**配置ファイル**:
- `read.ts`: ファイル読み取りツール
- `write.ts`: ファイル書き込みツール
- `edit.ts`: ファイル部分編集ツール
- `bash.ts`: シェルコマンド実行ツール
- `glob.ts`: Glob パターン検索ツール
- `grep.ts`: 正規表現検索ツール
- `skill.ts`: スキル呼び出しツール
- `sub-agent.ts`: サブエージェント実行ツール
- `index.ts`: 全ツールのエクスポートと ToolDispatcher への登録（バレルであるが、`createXxxTool()` を呼び出して `ToolDispatcher.register()` するスタートアップロジックも含む）

**命名規則**: kebab-case、ツール名（小文字）

**依存関係**:
- 依存可能: `loaders/`, `types/`
- 依存禁止: `cli/`, `providers/`（sub-agent.ts は例外的に `agent/` に依存）

```
tools/
├── read.ts
├── write.ts
├── edit.ts
├── bash.ts
├── glob.ts
├── grep.ts
├── skill.ts
├── sub-agent.ts
└── index.ts
```

### src/providers/ (プロバイダーレイヤー)

**役割**: API 通信の抽象化

**配置ファイル**:
- `provider.ts`: Provider インターフェース定義
- `anthropic.ts`: Anthropic API 実装
- `gemini.ts`: Gemini API 実装
- `openai-compatible.ts`: OpenAI 互換 API 実装（Groq / OpenRouter）
- `provider-factory.ts`: AppConfig に応じた Provider インスタンス生成（自動検出対応）

**命名規則**: kebab-case、プロバイダー名

**依存関係**:
- 依存可能: `types/`
- 依存禁止: `cli/`, `agent/`, `tools/`

```
providers/
├── provider.ts
├── anthropic.ts
└── provider-factory.ts
```

### src/loaders/ (ローダー)

**役割**: コマンド/スキル/エージェント定義ファイルの読み込みと解析

**配置ファイル**:
- `command-loader.ts`: `.commands/*.md` の読み込みと frontmatter 解析
- `skill-loader.ts`: `.skills/*/SKILL.md` の読み込み
- `agent-loader.ts`: `.agents/*.md` の読み込み
- `frontmatter.ts`: YAML frontmatter の共通パーサー

**命名規則**: kebab-case、`[対象]-loader.ts`

**依存関係**:
- 依存可能: `types/`
- 依存禁止: `cli/`, `agent/`, `tools/`, `providers/`

```
loaders/
├── command-loader.ts
├── skill-loader.ts
├── agent-loader.ts
└── frontmatter.ts
```

### src/types/ (型定義)

**役割**: プロジェクト全体で共有する型定義

**配置ファイル**:
- `tool.ts`: ToolDefinition, ToolResult 等のツール関連型
- `command.ts`: CommandDefinition 型
- `skill.ts`: SkillDefinition 型
- `agent.ts`: AgentDefinition 型
- `config.ts`: AppConfig 型
- `conversation.ts`: ConversationContext, ConversationRecord 型
- `provider.ts`: CreateMessageParams, Stream 等のプロバイダー関連型

**命名規則**: kebab-case、ドメイン名

**依存関係**:
- 依存可能: なし（最下層）
- 依存禁止: 他の全ディレクトリ

```
types/
├── tool.ts
├── command.ts
├── skill.ts
├── agent.ts
├── config.ts
├── conversation.ts
├── provider.ts
└── index.ts    # 全型のバレルエクスポート（import 先は '../types' で統一）
```

### tests/ (テストディレクトリ)

#### unit/

**役割**: 個別モジュールのユニットテスト

**構造**: `src/` のテスト対象レイヤーをミラー

**ユニットテスト対象外の例外**:
- `cli/` および `src/index.ts`（エントリーポイント）: ユーザー入力依存のため `tests/e2e/` で対応
- `providers/`: モック使用のため `tests/integration/` で対応
- `agent/agent-loop.ts`: Agent ループ全体の統合動作のため `tests/integration/agent-loop.test.ts` で対応（`agent/` の他コンポーネントはユニットテスト対象）
- `tools/sub-agent.ts`: `sub-agent.ts` 本体のユニットテストは対象（`agent/agent-loop.ts` を依存としてモック）。サブエージェントの起動〜結果返却の統合動作は `tests/integration/sub-agent-loop.test.ts` で対応
- `tools/index.ts`: ツール登録ロジックは統合テスト（`agent-loop.test.ts`）でカバーし、ユニットテストは設けない
- `types/`: 型定義のみで実行ロジックを持たないためユニットテスト対象外

```
tests/unit/
├── tools/
│   ├── read.test.ts
│   ├── write.test.ts
│   ├── edit.test.ts
│   ├── bash.test.ts
│   ├── glob.test.ts
│   ├── grep.test.ts
│   ├── skill.test.ts
│   └── sub-agent.test.ts
├── loaders/
│   ├── command-loader.test.ts
│   ├── skill-loader.test.ts
│   ├── agent-loader.test.ts
│   └── frontmatter.test.ts
└── agent/
    ├── system-prompt.test.ts
    ├── tool-dispatcher.test.ts
    └── conversation-store.test.ts
```

#### integration/

**役割**: モジュール間連携のテスト（モック Provider を使用し、実 API は呼ばない）

**構造**: ファイルごとにシナリオを 1 つ対応させる（unit/ のミラー構造はとらない）

```
tests/integration/
├── agent-loop.test.ts          # モック Provider での Agent ループ
├── command-execution.test.ts   # コマンド読み込み → 実行
└── sub-agent-loop.test.ts      # メインループからサブエージェント起動と結果返却
```

#### e2e/

**役割**: CLI 全体の動作確認（モック Provider を使用し、実際の LLM API は呼び出さない）

```
tests/e2e/
├── basic-conversation.test.ts  # 起動 → 質問 → 応答
└── file-operations.test.ts     # ファイル操作の一連フロー
```

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| CLI 処理 | src/cli/ | kebab-case | repl.ts |
| Agent ロジック | src/agent/ | kebab-case | agent-loop.ts |
| ツール実装 | src/tools/ | kebab-case（ツール名） | read.ts, bash.ts |
| API Provider | src/providers/ | kebab-case（プロバイダー名） | anthropic.ts |
| ローダー | src/loaders/ | kebab-case + `-loader` | command-loader.ts |
| 型定義 | src/types/ | kebab-case（ドメイン名） | tool.ts, config.ts |
| エントリーポイント | src/ | アプリ起動点（CLI 引数解析 → Repl 起動。バレルではない） | index.ts |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | tests/unit/[layer]/ | [対象].test.ts | read.test.ts |
| 統合テスト | tests/integration/ | [機能].test.ts（unit/ のミラー構造なし、シナリオ単位） | agent-loop.test.ts |
| E2E テスト | tests/e2e/ | [シナリオ].test.ts | basic-conversation.test.ts |

### 設定ファイル

| ファイル | 配置先 | 説明 |
|---------|--------|------|
| tsconfig.json | ルート | TypeScript コンパイル設定 |
| tsup.config.ts | ルート | ビルド設定 |
| vitest.config.ts | ルート | テスト設定 |
| .editorconfig | ルート | インデント・文字コード・行末統一設定 |
| .eslintrc.json | ルート | Lint 設定（MVP 時点では未採用、下記注釈参照） |

> **注釈 — .eslintrc.json**: MVP 段階では TypeScript コンパイラの型エラーと `npm run typecheck` によるパス解析で依存ルール違反を検知する。ESLint 導入時にルートへ配置し、`eslint-plugin-import` の `no-restricted-imports` でレイヤー間の依存方向を自動検証する。

## 命名規則

### ディレクトリ名

- **レイヤーディレクトリ**: 複数形不要、kebab-case（役割が明確なため）
  - 例: `cli/`, `agent/`, `tools/`, `providers/`, `loaders/`, `types/`
- **テストディレクトリ**: 種別名
  - 例: `unit/`, `integration/`, `e2e/`

### ファイル名

- **モジュールファイル**: kebab-case
  - 例: `agent-loop.ts`, `tool-dispatcher.ts`, `system-prompt.ts`
- **ツールファイル**: ツール名の kebab-case
  - 例: `read.ts`, `write.ts`, `sub-agent.ts`
- **型定義ファイル**: ドメイン名の kebab-case
  - 例: `tool.ts`, `config.ts`, `conversation.ts`
- **テストファイル**: `[テスト対象].test.ts`
  - 例: `read.test.ts`, `agent-loop.test.ts`
- **index.ts（バレル）**: 各レイヤーのエクスポートをまとめる
  - `src/tools/index.ts`: 全ツールのエクスポートと登録（バレル兼スタートアップ。`createXxxTool()` 呼び出しと `ToolDispatcher.register()` を含む）
  - `src/types/index.ts`: 全型のバレルエクスポート（`import { X } from '../types'` で参照）

### エクスポート名

- **インターフェース/型**: PascalCase
  - 例: `ToolDefinition`, `Provider`, `AppConfig`
- **クラス**: PascalCase
  - 例: `AgentLoop`, `ToolDispatcher`, `AnthropicProvider`, `GeminiProvider`
- **関数**: camelCase
  - 例: `createReadTool`, `parseFrontmatter`
- **定数**: UPPER_SNAKE_CASE
  - 例: `DEFAULT_MODEL`, `DEFAULT_TIMEOUT`

## 依存関係のルール

### レイヤー間の依存

```
cli/ ──→ agent/ ──→ tools/ ──→ providers/
  │         │         │
  └────┬────┘────┬────┘
       ↓         ↓
    loaders/（cli/ / agent/ / tools/ から参照可）

    types/（最下層。全レイヤーから参照可、他への依存なし）
```

> 依存方向の詳細な定義と根拠は `docs/architecture.md` の「依存方向」セクションを参照。

**禁止される依存**:
- providers/ → tools/ / agent/ / cli/
- loaders/ → tools/ / agent/ / cli/ / providers/
- tools/ → cli/ / providers/（sub-agent.ts は例外）
- agent/ → cli/

### 例外: サブエージェントツール

`tools/sub-agent.ts` は `agent/agent-loop.ts` に依存する（再帰呼び出し）。
これは設計上の意図的な例外であり、サブエージェントの独立コンテキスト実行に必要。

## スケーリング戦略

### ツールの追加

新しいツールは `src/tools/` に 1 ファイルとして追加し、`src/tools/index.ts` で登録:

```typescript
// src/tools/my-new-tool.ts
export function createMyNewTool(): ToolDefinition {
  return {
    name: 'MyNewTool',
    description: '...',
    input_schema: { /* ... */ },
    handler: async (input) => { /* ... */ },
  };
}

// src/tools/index.ts に追加登録
```

### Provider の追加

`src/providers/` に新しいファイルを追加:

```
providers/
├── provider.ts       # インターフェース（変更なし）
├── anthropic.ts      # 既存
└── bedrock.ts        # 新規追加
```

### ファイルサイズの管理

可読性と単一責任の維持を目的として:

- 1 ファイル: 300 行以下を推奨
- 300-500 行: リファクタリングを検討
- 500 行以上: 分割を強く推奨（1 モジュール = 1 責務の原則から逸脱している可能性が高い）

**注意**: `agent-loop.ts` や `tool-dispatcher.ts` は複数の責務が集約しやすいため、基準超過時は優先的に分割を検討すること。

## ランタイムデータディレクトリ

リポジトリ外に保存されるアプリケーションデータ:

```
~/.claude-code-like/            # ホームディレクトリ配下（Git 管理外）
├── config.json                 # アプリ設定（AppConfig 型）
├── conversations/              # 会話履歴
│   └── [uuid].json             # 個別会話（ConversationRecord 型）
└── logs/                       # API 通信ログ（--debug 時のみ生成）
    └── [YYYY-MM-DD].jsonl      # 日別ログ
```

**初期化タイミング**: CLI 起動時に `~/.claude-code-like/` が存在しなければ自動作成する（`ConversationStore` コンストラクタが担当）。
**パーミッション**: `700`（所有者のみアクセス）

## 除外設定

### .gitignore

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.steering/
```

### ビルド除外

`tsup.config.ts` で `tests/` を除外。`dist/` にはビルド成果物のみ出力。

## 構造健全性の検証

| 項目 | 検証方法 | 合否基準 |
|------|---------|---------|
| 依存方向ルール | `npm run typecheck` | 型エラーおよびパス解析エラー 0 件 |
| ファイルサイズ | `wc -l src/**/*.ts` 等 | 300 行以下（300–500 行は要検討、500 行超は要分割） |
| テスト対応状況 | `find tests/unit -name '*.test.ts'` 等でファイル一覧を生成し `src/` と対比 | `unit/` の対象ファイルに対応する `.test.ts` が存在すること（上記「ユニットテスト対象外の例外」に列挙されたファイルを除く） |
