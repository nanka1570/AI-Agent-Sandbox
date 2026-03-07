# 開発ガイドライン (Development Guidelines)

## コーディング規約

### 命名規則

#### 変数・関数

```typescript
// 変数: camelCase、名詞または名詞句
const systemPrompt = buildSystemPrompt();
const toolDefinitions = loadTools();

// 関数: camelCase、動詞で始める
function createReadTool(): ToolDefinition { }
function parseFrontmatter(content: string): Frontmatter { }
async function dispatchTool(name: string, input: unknown): Promise<ToolResult> { }

// 定数: UPPER_SNAKE_CASE
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_TIMEOUT = 120;
const DEFAULT_MAX_TOKENS = 8192;

// Boolean: is, has, should で始める
const isStreaming = true;
const hasClaudeMd = existsSync('CLAUDE.md');
const requiresConfirmation = tool.requiresConfirmation ?? false;
```

#### クラス・インターフェース・型

```typescript
// クラス: PascalCase、名詞
class AgentLoop { }
class ToolDispatcher { }
class AnthropicProvider { }
class GeminiProvider { }
class OpenAICompatibleProvider { }

// インターフェース: PascalCase
interface Provider { }
interface ToolDefinition { }

// 型エイリアス: PascalCase
type ToolResult = { content: string; is_error?: boolean };
```

### コードフォーマット

フォーマットは `.editorconfig` で統一する:

```ini
# .editorconfig
root = true

[*.ts]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100
```

### Lint（ESLint）

MVP 段階では ESLint は未採用。TypeScript コンパイラ（`tsc --noEmit`）による型チェックとパス解析で代替する。
ESLint 導入時は `.eslintrc.json` をルートに配置し、`eslint-plugin-import` の `no-restricted-imports` でレイヤー間依存を自動検証する（repository-structure.md の「構造健全性の検証」を参照）。

- **インデント**: 2 スペース
- **行の長さ**: 最大 100 文字
- **セミコロン**: あり
- **クォート**: シングルクォート
- **末尾カンマ**: あり（trailing comma）
- **モジュール**: ESM（`import` / `export`）

### TypeScript 設定方針

本プロジェクトは `strict: true` を有効にして運用する。特に注意する制約:

```typescript
// noUncheckedIndexedAccess: 配列アクセスの結果は T | undefined
// ❌
const first = items[0].name;
// ✅
const first = items[0]?.name ?? 'default';
```

ESM で統一するため、相対インポートには `.js` 拡張子を付ける:

```typescript
// ❌
import { createReadTool } from './tools/read';
// ✅
import { createReadTool } from './tools/read.js';
```

### 型定義

```typescript
// 関数の引数・返り値には明示的に型注釈
function createTool(name: string, handler: ToolHandler): ToolDefinition { }

// オブジェクト型はインターフェースで定義
interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<ToolResult>;
}

// ユニオン型は type で定義
type StopReason = 'end_turn' | 'tool_use' | 'max_tokens';

// any は使用禁止。unknown を使い、型ガードで絞り込む
function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

### コメント規約

```typescript
// コメントは日本語で記述

// ✅ 良い例: なぜそうするかを説明
// Bash ツールは危険な操作を含む可能性があるため、実行前に必ず確認する
if (tool.requiresConfirmation) {
  await promptConfirmation(command);
}

// ❌ 悪い例: コードを見れば分かることを書く
// 確認が必要な場合
if (tool.requiresConfirmation) {
  await promptConfirmation(command);
}
```

- 自明なコードにはコメントを書かない
- 「なぜ」を書く。「何を」はコードで表現する
- TSDoc は公開 API のみに付ける（内部実装には不要）

### エラーハンドリング

```typescript
// ツール実行エラーは ToolResult として返却（is_error: true）
async function executeRead(input: ReadInput): Promise<ToolResult> {
  try {
    const content = await readFile(input.file_path, 'utf-8');
    return { content };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { content: `ファイルが見つかりません: ${input.file_path}`, is_error: true };
    }
    return { content: `読み取りエラー: ${(error as Error).message}`, is_error: true };
  }
}

// API エラーはユーザーに通知
async function callApi(params: CreateMessageParams): Promise<Stream> {
  try {
    return await provider.createMessage(params);
  } catch (error) {
    if (error instanceof APIError && error.status === 429) {
      console.error('API レート制限に達しました。しばらく待ってから再試行してください');
    }
    throw error;
  }
}
```

**原則**:
- ツール実行エラーは `is_error: true` で API にフィードバック（AI が次のアクションを判断）
- API エラーはユーザーに通知
- エラーを握りつぶさない

## Git 運用ルール

### ブランチ戦略

個人開発のため、シンプルな trunk-based 開発:

- `main`: 安定版。常に動作する状態を保つ
- `feature/[機能名]`: 新機能開発（Phase 単位で作成）
- `fix/[修正内容]`: バグ修正

```
main
  ├── feature/phase1-repl
  ├── feature/phase2-tool-use
  ├── feature/phase3-core-tools
  ├── feature/phase4-ux
  ├── feature/phase5-commands-skills-agents
  └── fix/streaming-display
```

### コミットメッセージ規約

```
<type>(<scope>): <subject>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: フォーマット修正
- `refactor`: 機能変更なしの改善
- `test`: テスト追加・修正
- `chore`: 環境・依存管理

**Scope（任意）**: `repl`, `tools`, `agent`, `provider`, `loader`

**例**:
```
feat(repl): 対話ループの基本実装
feat(tools): Read ツールの実装
fix(agent): ストリーミング中断時のハンドリング修正
test(tools): Edit ツールのユニットテスト追加
docs: 機能設計書の作成
```

### マージフロー

個人開発のため Pull Request は省略可。以下の手順でマージ:

```bash
# feature ブランチで実装完了後
git checkout main
git merge --no-ff feature/phase1-repl -m "feat: Phase 1 REPL 実装完了"
git branch -d feature/phase1-repl  # マージ済みブランチを削除
```

`--no-ff` でマージコミットを残し、Phase 単位の変更履歴を追跡可能にする。

## テスト戦略

### テストの種類とカバレッジ

| テスト種別 | 対象 | カバレッジ目標 | フレームワーク |
|-----------|------|--------------|--------------|
| ユニットテスト | ツール handler、ローダー、プロンプト生成 | 80% 以上（カバレッジ集計対象: `src/tools/`, `src/loaders/`, `src/agent/system-prompt.ts`） | Vitest |
| 統合テスト | Agent ループ（モック Provider）、コマンド実行フロー、サブエージェント起動 | 定義済みシナリオの全パス | Vitest |
| E2E テスト | CLI 全体の動作 | スモークテスト | Vitest |

### テスト命名規則

テストラベルは日本語で記述:

```typescript
describe('Read ツール', () => {
  it('指定パスのファイル内容を行番号付きで返す', async () => {
    // テスト実装
  });

  it('存在しないファイルの場合エラーを返す', async () => {
    // テスト実装
  });

  it('バイナリファイルの場合メッセージを返す', async () => {
    // テスト実装
  });
});
```

### モックの方針

- **Provider**: 常にモック（実 API を呼ばない）
- **ファイルシステム**: テスト用一時ディレクトリを使用
- **子プロセス**: Bash ツールのテストではモック化

```typescript
// Provider のモック例
const mockProvider: Provider = {
  modelId: 'mock-model',
  createMessage: vi.fn().mockResolvedValue(createMockStream([
    { type: 'text', text: 'こんにちは' },
  ])),
};
```

## コードレビュー基準

本プロジェクトは個人開発のため、Pull Request レビューは省略しセルフレビューで完結する。
マージ前に以下のチェックリストを確認すること。

### セルフレビューチェックリスト

実装完了時に `npm run check` で一括確認:

**型・品質**
- [ ] 型エラーがない（`npm run typecheck`）
- [ ] テストが全てパス（`npm test`）
- [ ] テストカバレッジが 80% 以上（`npm run test:coverage`）

**セキュリティ**
- [ ] API キーやセンシティブ情報がハードコードされていない
- [ ] 新規ツールに `requiresConfirmation` の設定が適切（Write/Bash 系は `true`）

**実装品質**
- [ ] エラーが適切にハンドリングされている（`is_error: true` で返却、握りつぶしなし）
- [ ] 不要な `console.log` が残っていない（デバッグログは `--debug` フラグで制御）
- [ ] 1 ファイル 300 行以下（repository-structure.md のファイルサイズ方針に準拠）
- [ ] 依存方向のルールに違反していない（`cli/` → `agent/` → `tools/` の一方向）

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | 22+ | Dev Container で自動セットアップ |
| npm | 10+ | Node.js に同梱 |

### セットアップ手順

#### 推奨: Dev Container を使う場合

VS Code + Dev Containers 拡張機能を使用:

1. VS Code でリポジトリを開く
2. コマンドパレット: `Dev Containers: Reopen in Container`
3. コンテナ起動後、Node.js 22 と npm が自動でセットアップされる

```bash
# いずれかの API キーを設定
export ANTHROPIC_API_KEY="sk-ant-..."   # Anthropic
# export GEMINI_API_KEY="..."           # Gemini
# export GROQ_API_KEY="..."             # Groq
# export OPENROUTER_API_KEY="..."       # OpenRouter
npm install
npm run dev
```

#### ローカル環境の場合

```bash
# 1. リポジトリのクローン
git clone [URL]
cd claude-code-like

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定（いずれか1つ以上）
export ANTHROPIC_API_KEY="sk-ant-..."   # Anthropic
# export GEMINI_API_KEY="..."           # Gemini
# export GROQ_API_KEY="..."             # Groq
# export OPENROUTER_API_KEY="..."       # OpenRouter

# 4. 開発モードで起動
npm run dev

# 5. テスト実行
npm test
```

### npm scripts

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "check": "npm run typecheck && npm test"
  }
}
```

