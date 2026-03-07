# 技術仕様書 (Architecture Design Document)

## テクノロジースタック

### 言語・ランタイム

| 技術 | バージョン | 選定理由 |
|------|-----------|----------|
| Node.js | 22+ (LTS) | ESM ネイティブ対応、readline/promises 等の最新 API が利用可能 |
| TypeScript | 5.x (strict mode) | 型安全性によりツール定義・API 型の不整合をコンパイル時に検出 |
| npm | 10.x | Node.js 22 に同梱、package-lock.json による厳密な依存管理 |

### フレームワーク・ライブラリ

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| @anthropic-ai/sdk | ^0.39.x | Claude API 通信 | 公式 SDK。ストリーミング・Tool Use の型定義が充実 |
| @google/genai | ^1.x | Gemini API 通信 | Google 公式 SDK。Function Calling 対応 |
| openai | ^4.x | OpenAI 互換 API 通信 | Groq・OpenRouter 等の OpenAI 互換エンドポイントに対応 |
| chalk | ^5.x | カラー出力 | ESM ネイティブ対応。軽量でシンプルな API |
| marked | ^15.x | Markdown パース | 標準的な Markdown パーサー |
| marked-terminal | ^7.x | ターミナル向け Markdown レンダリング | marked と組み合わせてターミナルに適した出力 |
| ora | ^8.x | スピナー表示 | ESM 対応。ストリーミング待機中の UX 向上 |
| fast-glob | ^3.x | Glob パターンマッチング | 高速。node_modules 等の除外が容易 |
| diff | ^7.x | diff 表示 | Edit ツールの変更可視化に使用 |
| yaml | ^2.x | YAML パース | コマンド/スキル/エージェントの frontmatter 解析 |

### 開発ツール

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Vitest | ^3.x | テストフレームワーク | ESM ネイティブ対応。高速でセットアップが簡単 |
| tsup | ^8.x | バンドル・ビルド | TypeScript から ESM バンドルを生成。CLI 配布に最適 |
| tsx | ^4.x | 開発時実行 | TypeScript を直接実行。`npm run dev` 用 |

## アーキテクチャパターン

### レイヤードアーキテクチャ

```
┌──────────────────────────────────────┐
│   CLI レイヤー (REPL)                 │ ← ユーザー入力の受付・表示・コマンド判定
├──────────────────────────────────────┤
│   エージェントレイヤー                 │ ← Agent ループ・ツールディスパッチ・プロンプト管理
├──────────────────────────────────────┤
│   ツールレイヤー                      │ ← 個別ツール実装（Read/Write/Edit/Bash/Glob/Grep/Skill/SubAgent）
├──────────────────────────────────────┤
│   プロバイダーレイヤー                 │ ← API 通信の抽象化（Anthropic / Gemini / Groq / OpenRouter）
└──────────────────────────────────────┘
```

#### CLI レイヤー
- **責務**: ユーザー入力の受付、`/コマンド` の判定、ストリーミング出力の表示
- **許可される操作**: エージェントレイヤーおよびローダー（`loaders/`）の呼び出し
- **禁止される操作**: ツールレイヤー・プロバイダーレイヤーへの直接アクセス

#### エージェントレイヤー
- **責務**: メッセージ管理、Tool Use ループ制御、システムプロンプト構築
- **許可される操作**: ツールレイヤーとプロバイダーレイヤーの呼び出し
- **禁止される操作**: CLI レイヤーへの依存（出力はコールバック経由）

#### ツールレイヤー
- **責務**: 個別ツールの実装（ファイル操作、シェル実行、スキル読み込み等）
- **許可される操作**: ファイルシステム、子プロセスへのアクセス
- **禁止される操作**: API 直接呼び出し（サブエージェントツールを除く）

#### プロバイダーレイヤー
- **責務**: API 通信の抽象化、ストリーミングレスポンスの返却
- **許可される操作**: 外部 API への HTTP 通信
- **禁止される操作**: ビジネスロジックの実装

### 依存方向

```
CLI → Agent → Tools
               ↓
           Provider → LLM API (Anthropic / Gemini / Groq / OpenRouter)
```

サブエージェントツールのみ例外的に Agent レイヤーを再帰呼び出しする:
```
Agent → Tools → SubAgentTool → Agent（独立コンテキスト）→ Tools（制限付き）
```

## データ永続化戦略

### ストレージ方式

| データ種別 | ストレージ | フォーマット | 理由 |
|-----------|----------|-------------|------|
| 会話履歴 | ローカルファイル | JSON | API メッセージ形式をそのまま保存 |
| 設定 | ローカルファイル | JSON | 手動編集可能、シンプル |
| API 通信ログ | ローカルファイル | JSONL | 1リクエスト1行で追記、解析容易 |
| コマンド/スキル/エージェント定義 | プロジェクトファイル | Markdown + YAML frontmatter | 人間が読み書きしやすい |

### データ保存場所

```
~/.claude-code-like/
├── config.json              # アプリ設定
├── conversations/           # 会話履歴
│   └── [uuid].json          # 個別会話
└── logs/                    # API 通信ログ
    └── [YYYY-MM-DD].jsonl   # 日別ログ
```

### バックアップ戦略

- **会話履歴**:
  - 正常終了時: `exit` / `quit` コマンド処理中に保存
  - ターン完了ごと: `stop_reason === "end_turn"` 後に上書き保存
  - 異常終了時: `process.on('SIGINT')` / `process.on('SIGTERM')` でシグナルハンドラーを登録し、受信時に即時保存してから終了
- **設定ファイル**: ユーザー管理。Git 管理を推奨

## パフォーマンス要件

### レスポンスタイム

| 操作 | 目標時間 | 備考 |
|------|---------|------|
| CLI 起動（初期化完了まで） | 1 秒以内 | コマンド/スキル定義の遅延読み込み |
| Read / Glob / Grep ツール | 500ms 以内 | ファイル数 10,000 以下、ファイルサイズ 1MB 以下のプロジェクトを対象 |
| Write / Edit ツール | 500ms 以内 | 書き込みコンテンツ 1MB 以下。確認プロンプト待ち時間を除く |
| Bash ツール | タイムアウト 120 秒 | 設定で変更可能 |
| 最初のストリーミングトークン表示 | 2 秒以内 | API レスポンス速度に依存 |

### リソース使用量

| リソース | 上限 | 理由 |
|---------|------|------|
| メモリ | 256 MB | Node.js プロセス基本使用量（約 50MB）+ 会話履歴（100 ターン x 平均 4KB ≒ 400KB）+ Read ツール一時バッファ。単一ファイル 10MB 超の全文読み込みは推奨しない |
| ディスク | 100 MB | 会話履歴・ログの蓄積上限（手動クリーンアップ: `~/.claude-code-like/conversations/` および `~/.claude-code-like/logs/` の古いファイルを削除） |

## セキュリティアーキテクチャ

### 通信セキュリティ

- **通信先**: Anthropic API エンドポイント (`api.anthropic.com`) のみ
- **プロトコル**: HTTPS（TLS 1.2+）
- **仲介サービス**: 一切経由しない（SDK がエンドポイントに直接通信）

### データ保護

- **API キー管理**: 環境変数 `ANTHROPIC_API_KEY` からのみ取得。コード・設定ファイル・ログに記録しない
- **ログマスキング**: `--debug` 時の通信ログでは API キーを `ANTH****` 形式にマスキング
- **ファイルパーミッション**: `~/.claude-code-like/` 配下は `700`（所有者のみアクセス）
- **テレメトリ**: 一切の利用状況データを外部に送信しない

### 入力検証

- **ツールパラメータ**: JSON Schema による型検証（Anthropic SDK が提供）
- **ファイルパス**: パストラバーサル攻撃の防止は意図的に行わない
  - **根拠**: 本ツールはローカル開発者が自ら実行する CLI であり、AI の指示に従うかどうかの最終判断はユーザーが行う（Write/Bash は確認プロンプト必須）
  - **緩和策**: Bash ツールの確認プロンプト、Write ツールの上書き確認
- **Bash コマンド**: 実行前に必ずユーザー確認を要求

### 最小権限の原則

- **サブエージェント**: `tools` フィールドで使用可能ツールを制限
- **コマンド**: `allowed-tools` フィールドで利用ツールを宣言（将来的な制限機能の基盤）

## エラーハンドリング方針

### レイヤー別エラー責務

| レイヤー | エラー種別 | 処理方針 |
|---------|-----------|---------|
| ツールレイヤー | ファイル不在・実行失敗 | `ToolResult { is_error: true }` として返却（Agent に判断を委ねる） |
| エージェントレイヤー | API エラー (4xx/5xx) | 例外をキャッチし CLI レイヤーへ伝播 |
| CLI レイヤー | Agent からの例外 | ユーザーへのエラー表示と次のプロンプト表示 |
| プロバイダーレイヤー | HTTP エラー | SDK 例外をそのまま再スロー |

## スケーラビリティ設計

### 会話データの増加

- **想定量**: 1 会話あたり最大数百ターン、保存ファイル数千件
- **対策**: 会話一覧表示時はメタデータ（ID, summary, createdAt）のみ読み込み。全文読み込みは resume 時のみ

### 機能拡張性

- **Provider 抽象化（E-04）**: `Provider` インターフェースにより Bedrock / Vertex AI 対応が可能
- **ツール追加**: `ToolDefinition` インターフェースに準拠すれば新規ツールを追加可能
- **コマンド/スキル/エージェント**: ファイルベースの定義で、コード変更なしに拡張可能

### 拡張ポイント一覧

```typescript
// 1. 新規ツールの追加
const myTool: ToolDefinition = {
  name: 'MyTool',
  description: '...',
  input_schema: { /* JSON Schema */ },
  handler: async (input) => { /* 実装 */ },
};
dispatcher.register(myTool);

// 2. 新規 Provider の追加（型定義の詳細は functional-design.md 参照）
// Provider インターフェース:
//   createMessage(params: CreateMessageParams): Promise<LLMResponse>
//   readonly modelId: string
// 対応済みプロバイダー: Anthropic, Gemini, Groq(OpenAI互換), OpenRouter(OpenAI互換)
class MyProvider implements Provider {
  // 1. 独自型のメッセージを対象 API 形式に変換
  // 2. API クライアントで通信
  // 3. レスポンスを LLMResponse 形式に変換して返却
  async createMessage(params: CreateMessageParams): Promise<LLMResponse> { /* ... */ }
  get modelId(): string { return 'my-model-id'; }
}

// 3. コマンド追加: .commands/my-command.md を配置するだけ
// 4. スキル追加: .skills/my-skill/SKILL.md を配置するだけ
// 5. エージェント追加: .agents/my-agent.md を配置するだけ
```

## テスト戦略

### ユニットテスト

- **フレームワーク**: Vitest
- **対象**: 各ツールの handler 関数、コマンドローダー、スキルローダー、プロンプト生成
- **カバレッジ目標**: ツール単体テスト 80% 以上（`npm run test:coverage` で計測）
- **テスト pass 率**: 各ツールハンドラーの正常系テストケースで 95% 以上が成功（`npm test` で確認）
- **テストファイル**: `tests/unit/**/*.test.ts`

### 統合テスト

- **方法**: モック Provider を使用し、Agent ループ全体をテスト
- **対象**: tool_use → tool_result → 再呼び出しのループ、コマンド実行フロー、サブエージェント起動
- **成功基準**: 全統合テストがパスすること（カバレッジ目標なし、シナリオ網羅を優先）

### E2E テスト

- **方法**: 実際の CLI を起動し、stdin/stdout をプログラムで制御（モック Provider を使用。実際の Anthropic API は呼び出さない）
- **シナリオ**: 起動 → 質問 → 応答、ファイル操作の一連フロー
- **成功基準**: 定義済みシナリオが全てパスすること（最低 2 シナリオ必須: ツール未使用の基本会話フロー `basic-conversation.test.ts` + ツール使用のファイル操作フロー `file-operations.test.ts`）

### テスト実行コマンド

| コマンド | 用途 |
|---------|------|
| `npm test` | ユニット + 統合テスト |
| `npm run test:coverage` | カバレッジレポート生成 |
| `npm run typecheck` | 型チェック |
| `npm run check` | 型チェック + テスト一括実行 |
| `vitest run tests/e2e/` | E2E テスト単独実行 |

## 技術的制約

### 環境要件

- **OS**: Linux, macOS, Windows（WSL 推奨）
- **Node.js**: 22.0.0 以上
- **必要な外部依存**: Anthropic API キー（`ANTHROPIC_API_KEY` 環境変数）

### パフォーマンス制約

- ストリーミング速度は Anthropic API のレスポンス速度に依存
- Bash ツールの実行時間はユーザーのコマンド内容に依存

### セキュリティ制約

- API 通信は Anthropic API のみ対応（Bedrock は E-04 で対応予定）
- ファイル操作の範囲制限は行わない（ユーザーの判断に委ねる）

## 依存関係管理

| ライブラリ | 用途 | バージョン管理方針 |
|-----------|------|-------------------|
| @anthropic-ai/sdk | API 通信 | ^ (マイナーまで許可) |
| chalk | カラー出力 | ^ (マイナーまで許可) |
| marked | Markdown パース | ^ (マイナーまで許可) |
| marked-terminal | ターミナル Markdown | ^ (マイナーまで許可) |
| ora | スピナー | ^ (マイナーまで許可) |
| fast-glob | Glob | ^ (マイナーまで許可) |
| diff | diff 表示 | ^ (マイナーまで許可) |
| yaml | YAML パース | ^ (マイナーまで許可) |
| vitest | テスト | ~ (パッチのみ自動) |
| tsup | ビルド | ~ (パッチのみ自動) |
| tsx | 開発時実行 | ~ (パッチのみ自動) |
| typescript | 型チェック | ~ (パッチのみ自動) |
