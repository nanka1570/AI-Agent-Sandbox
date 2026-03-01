# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
taskcli/
├── src/                       # ソースコード
│   ├── cli/                   # CLIレイヤー（エントリポイント、コマンド定義）
│   │   ├── index.ts           # CLIエントリポイント
│   │   ├── commands/          # 各サブコマンドの実装
│   │   └── utils/             # CLI固有のユーティリティ（フォーマット、バリデーション）
│   ├── services/              # サービスレイヤー（ビジネスロジック、データ永続化）
│   ├── types/                 # 型定義
│   └── utils/                 # ユーティリティ関数
├── tests/                     # テストコード
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト
│   └── e2e/                   # E2Eテスト
├── docs/                      # プロジェクトドキュメント
│   └── ideas/                 # 下書き・アイデア
├── .claude/                   # Claude Code設定
├── .steering/                 # ステアリングファイル（作業単位ドキュメント）
├── package.json               # プロジェクト設定・依存関係
├── tsconfig.json              # TypeScript設定（コンパイル・ビルド兼用）
├── vitest.config.ts           # Vitestテスト設定
├── eslint.config.js           # ESLint設定
└── .prettierrc                # Prettier設定
```

## ディレクトリ詳細

### src/cli/ (CLIレイヤー)

**役割**: ユーザー入力の受付、Commander.jsによるコマンド・オプション定義、結果の表示

**配置ファイル**:
- `index.ts`: CLIのエントリポイント。Commander.jsのprogramを生成し、各コマンドを登録
- `commands/*.ts`: 各サブコマンドの定義ファイル
- `utils/formatter.ts`: CLI出力のフォーマット（テーブル表示、詳細表示等）
- `utils/validation.ts`: CLI入力のバリデーション（ID解析、タイトル検証等）

**命名規則**:
- コマンドファイル: `{コマンド名}.ts`（kebab-case）
- 例: `add.ts`, `list.ts`, `start.ts`, `done.ts`

**依存関係**:
- 依存可能: `services/`, `types/`, `utils/`
- 依存禁止: `services/storage.ts`への直接アクセス、`node:fs`等ファイルシステムへの直接操作

**例**:
```
src/cli/
├── index.ts              # CLIエントリポイント
├── commands/
│   ├── add.ts            # task add コマンド
│   ├── list.ts           # task list コマンド
│   ├── show.ts           # task show コマンド
│   ├── start.ts          # task start コマンド
│   ├── done.ts           # task done コマンド
│   ├── delete.ts         # task delete コマンド
│   ├── archive.ts        # task archive コマンド
│   └── search.ts         # task search コマンド（P1）
└── utils/
    ├── formatter.ts      # CLI出力のフォーマット（テーブル表示等）
    └── validation.ts     # CLI入力のバリデーション
```

### src/services/ (サービスレイヤー + データレイヤー)

**役割**: タスク管理のビジネスロジック、Git操作、データ永続化

**配置ファイル**:
- `task-service.ts`: タスクのCRUD操作、ステータス遷移のビジネスロジック
- `git-service.ts`: Gitリポジトリ操作（ブランチ作成・切り替え・マージ等）
- `storage.ts`: JSONファイルの読み書き（アトミック書き込み）

**命名規則**:
- サービスファイル: `{名前}-service.ts`（kebab-case）
- データ関連: `storage.ts`

**依存関係**:
- 依存可能: `types/`, `utils/`
- 依存禁止: `cli/`（下位レイヤーから上位レイヤーへの依存禁止）

**例**:
```
src/services/
├── task-service.ts       # TaskService: タスク管理ビジネスロジック
├── git-service.ts        # GitService: Git操作
└── storage.ts            # Storage: JSONファイル永続化
```

### src/types/ (型定義)

**役割**: プロジェクト全体で共有する型定義

**配置ファイル**:
- `task.ts`: Task、TaskStatus、TaskPriority、TaskStoreの型定義

**命名規則**:
- 型定義ファイル: `{エンティティ名}.ts`（kebab-case）

**依存関係**:
- 依存可能: なし（型定義は他に依存しない）
- 依存禁止: `cli/`, `services/`, `utils/`

**例**:
```
src/types/
└── task.ts               # Task, TaskStatus, TaskPriority, TaskStore
```

### src/utils/ (ユーティリティ)

**役割**: 複数のレイヤーで使用する汎用関数

**配置ファイル**:
- `branch-name.ts`: タスクタイトルからGitブランチ名を生成する関数
- `formatter.ts`: CLIに依存しない純粋なデータ変換・文字列整形関数（`src/cli/utils/formatter.ts`はchalkによる色付けなどCLI固有の表示処理）

**命名規則**:
- ユーティリティファイル: `{機能名}.ts`（kebab-case）

**依存関係**:
- 依存可能: `types/`
- 依存禁止: `cli/`, `services/`

**例**:
```
src/utils/
├── branch-name.ts        # generateBranchName()
└── formatter.ts          # formatTaskTable(), formatTaskDetail()
```

### tests/ (テストディレクトリ)

#### unit/

**役割**: 個別のクラス・関数の単体テスト

**構造**:
```
tests/unit/
├── services/
│   ├── task-service.test.ts
│   ├── git-service.test.ts
│   └── storage.test.ts
└── utils/
    ├── branch-name.test.ts
    └── formatter.test.ts
```

**命名規則**:
- パターン: `{テスト対象ファイル名}.test.ts`
- srcディレクトリの構造をミラーリング

#### integration/

**役割**: 複数コンポーネントの結合テスト

**構造**:
```
tests/integration/
└── task-lifecycle.test.ts    # タスクのライフサイクル全体テスト
```

#### e2e/

**役割**: CLIコマンドの実行を通じたエンドツーエンドテスト

**構造**:
```
tests/e2e/
└── cli-workflow.test.ts      # CLIの基本ワークフローテスト
```

### docs/ (ドキュメントディレクトリ)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書（本ドキュメント）
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集
- `ideas/`: 下書き・アイデアメモ

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| CLIエントリポイント | src/cli/ | index.ts | index.ts |
| コマンド定義 | src/cli/commands/ | {コマンド名}.ts | add.ts, list.ts |
| CLIユーティリティ | src/cli/utils/ | {機能名}.ts | formatter.ts, validation.ts |
| サービスクラス | src/services/ | {名前}-service.ts | task-service.ts |
| データアクセス | src/services/ | storage.ts | storage.ts |
| 型定義 | src/types/ | {エンティティ名}.ts | task.ts |
| ユーティリティ | src/utils/ | {機能名}.ts | branch-name.ts |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | tests/unit/{レイヤー}/ | {対象}.test.ts | task-service.test.ts |
| 統合テスト | tests/integration/ | {機能}.test.ts | task-lifecycle.test.ts |
| E2Eテスト | tests/e2e/ | {シナリオ}.test.ts | cli-workflow.test.ts |

### 設定ファイル

| ファイル種別 | 配置先 | 命名規則 |
|------------|--------|---------|
| TypeScript設定 | プロジェクトルート | tsconfig.json（コンパイル・ビルド兼用） |
| テスト設定 | プロジェクトルート | vitest.config.ts |
| パッケージ設定 | プロジェクトルート | package.json |
| ESLint設定 | プロジェクトルート | eslint.config.js |
| Prettier設定 | プロジェクトルート | .prettierrc |

## 命名規則

### ディレクトリ名

- **レイヤーディレクトリ**: 複数形、kebab-case
  - 例: `commands/`, `services/`, `types/`, `utils/`
- **テストディレクトリ**: 種別名、kebab-case
  - 例: `unit/`, `integration/`, `e2e/`

### ファイル名

- **全ファイル**: kebab-case
  - 例: `task-service.ts`, `branch-name.ts`, `git-service.ts`
- **エントリポイント**: `index.ts`
- **テストファイル**: `{対象ファイル名}.test.ts`
  - 例: `task-service.test.ts`, `branch-name.test.ts`

### export名

- **クラス**: PascalCase
  - 例: `TaskService`, `GitService`, `Storage`
- **関数**: camelCase
  - 例: `generateBranchName()`, `formatTaskTable()`
- **型・インターフェース**: PascalCase
  - 例: `Task`, `TaskStatus`, `TaskStore`
- **定数**: UPPER_SNAKE_CASE
  - 例: `DEFAULT_PRIORITY`, `MAX_TITLE_LENGTH`

## 依存関係のルール

### レイヤー間の依存

```
cli/commands/  →  services/  →  types/
                      ↓            ↑
                   utils/  ────────┘
```

**許可される依存**:
- `cli/` → `services/`, `types/`, `utils/`
- `services/` → `types/`, `utils/`
- `utils/` → `types/`

**禁止される依存**:
- `services/` → `cli/`（下位→上位レイヤー）
- `types/` → `cli/`, `services/`, `utils/`（型定義は非依存）
- 循環依存（A→B→A）

## スケーリング戦略

### 機能の追加

新しいコマンドを追加する際の手順:

1. `src/types/`に必要な型定義を追加（該当する場合）
2. `src/services/`にビジネスロジックを追加
3. `src/cli/commands/`に新しいコマンドファイルを作成
4. `src/cli/index.ts`にコマンドを登録
5. `tests/`に対応するテストを追加

### ファイルサイズの管理

- 1ファイル: 300行以下を推奨
- 300〜500行: リファクタリングを検討
- 500行以上: 分割を強く推奨

### モジュール分離のタイミング

サービス内のファイル数が増えた場合（10ファイル以上）、機能ごとにサブディレクトリを作成:

```
src/services/
├── task/                     # タスク管理モジュール
│   ├── task-service.ts
│   └── task-validator.ts
├── git/                      # Git連携モジュール
│   └── git-service.ts
└── storage.ts
```

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── YYYYMMDD-task-name/
    ├── requirements.md       # 今回の作業の要求内容
    ├── design.md             # 変更内容の設計
    └── tasklist.md           # タスクリスト
```

**命名規則**: `20260301-add-task-crud` 形式

### .claude/ (Claude Code設定)

**役割**: Claude Codeの設定とスキル定義

## 除外設定

### .gitignore

```
node_modules/
dist/
*.log
.DS_Store
.taskcli/              # ユーザーデータ（ユーザー判断で除外可能）
coverage/
*.tmp
```

**注意**: `.taskcli/`はユーザーがチームでタスクを共有するかどうかで判断する。初回実行時にガイダンスを表示。
