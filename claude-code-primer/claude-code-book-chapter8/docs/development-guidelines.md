# 開発ガイドライン (Development Guidelines)

## コーディング規約

### 命名規則

#### 変数・関数

```typescript
// 変数: camelCase、名詞または名詞句
const taskTitle = "ユーザー認証の実装";
const taskList = await taskService.listTasks();
const isCompleted = task.status === "completed";

// 関数: camelCase、動詞で始める
function generateBranchName(taskId: number, title: string): string { }
function formatTaskTable(tasks: Task[]): string { }
function validateTitle(title: string): void { }

// Boolean: is, has, should, can で始める
const isGitRepository = await gitService.isGitRepository();
const hasUncommittedChanges = await gitService.hasUncommittedChanges();

// 定数: UPPER_SNAKE_CASE
const MAX_TITLE_LENGTH = 200;
const DEFAULT_PRIORITY: TaskPriority = "medium";
const DEFAULT_STATUS: TaskStatus = "open";
```

#### クラス・インターフェース・型

```typescript
// クラス: PascalCase、名詞
class TaskService { }
class GitService { }
class Storage { }

// インターフェース: PascalCase（I接頭辞は付けない）
interface Task { }
interface TaskStore { }

// 型エイリアス: PascalCase
type TaskStatus = "open" | "in_progress" | "completed" | "archived";
type TaskPriority = "high" | "medium" | "low";
```

#### ファイル名

```
// すべて kebab-case
task-service.ts
git-service.ts
storage.ts
branch-name.ts
formatter.ts
task.ts（型定義）

// テスト: {対象}.test.ts
task-service.test.ts
branch-name.test.ts
```

### コードフォーマット

**インデント**: 2スペース
**行の長さ**: 最大100文字
**セミコロン**: あり
**クォート**: ダブルクォート
**末尾カンマ**: あり（ES5互換）

### コメント規約

```typescript
// ✅ 良い例: なぜそうするかを説明
// アトミック書き込みのため、一時ファイル経由でリネーム
fs.writeFileSync(tmpPath, data);
fs.renameSync(tmpPath, targetPath);

// ✅ 良い例: 複雑なロジックの意図を説明
// 日本語を含むタイトルからブランチ名を生成する際、
// 英数字とハイフン以外の文字を除去してGitのref名制約に適合させる
const slug = title.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

// ❌ 悪い例: コードを見れば分かることを繰り返す
// タイトルを変数に代入する
const title = task.title;
```

**TSDocコメント**: 公開API（exportされるクラス・関数）にのみ記載。内部実装の自明な関数には不要。

### エラーハンドリング

```typescript
// カスタムエラークラス
class TaskNotFoundError extends Error {
  constructor(public taskId: number) {
    super(`タスク #${taskId} が見つかりません`);
    this.name = "TaskNotFoundError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// CLIレイヤーでのエラーハンドリング
try {
  const task = taskService.addTask(title);
  console.log(`タスクを作成しました (ID: ${task.id})`);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
  if (error instanceof TaskNotFoundError) {
    console.error(`エラー: ${error.message}`);
    console.error(`ヒント: \`task list\` で既存のタスクを確認してください`);
    process.exit(1);
  }
  // 予期しないエラー
  console.error("予期しないエラーが発生しました");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
```

**原則**:
- サービスレイヤーでは適切なカスタムエラーをthrow
- CLIレイヤーでcatchしてユーザーフレンドリーなメッセージに変換
- エラーメッセージには「何が起きたか」と「どうすればよいか」を含める
- エラーを無視しない（catchしてreturn nullは禁止）

## Git運用ルール

### ブランチ戦略

**ブランチ種別**:
- `main`: 本番リリース可能な安定版
- `develop`: 開発の最新状態（統合ブランチ）
- `feature/{機能名}`: 新機能開発
- `fix/{修正内容}`: バグ修正
- `refactor/{対象}`: リファクタリング

**フロー**:
```
main
  └─ develop
      ├─ feature/task-crud
      ├─ feature/git-integration
      └─ fix/branch-name-generation
```

> **注記**: MVP段階では開発者が少数の場合、`develop`ブランチを省略して`main`から直接`feature/`ブランチを作成する簡略化されたフローも許容する。チーム規模の拡大に応じてdevelopブランチを導入する。

**マージ方針**:
- feature/fix → develop: Squash merge（コミット履歴をクリーンに）
- develop → main: Merge commit（リリース履歴を保持）

### コミットメッセージ規約

**Conventional Commits形式**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type一覧**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット（動作に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、依存関係更新等

**Scope**: `task`, `git`, `storage`, `cli`

**例**:
```
feat(task): タスクの基本CRUD操作を実装

- task add でタスク作成
- task list でタスク一覧表示
- task show でタスク詳細表示
- task done でタスク完了
- task delete でタスク削除

Closes #1
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] 全てのテストがパス (`npm test`)
- [ ] 型チェックがパス (`npm run typecheck`)
- [ ] ビルドが成功 (`npm run build`)

**PRテンプレート**:

```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加
- [ ] 手動テスト実施

## 関連Issue
Closes #[Issue番号]
```

**PRのサイズ**: 変更行数300行以内を推奨。大きくなる場合は分割する。

## テスト戦略

### テストの種類とカバレッジ目標

| テスト種別 | 対象 | カバレッジ目標 | フレームワーク |
|-----------|------|--------------|--------------|
| ユニットテスト | 個別のクラス・関数 | サービス80%以上、Storage/ユーティリティ90%以上 | Vitest |
| 統合テスト | 複数コンポーネント連携 | 主要フロー100% | Vitest |
| E2Eテスト | CLIコマンド実行 | 基本フロー100% | Vitest + child_process |

**カバレッジの確認方法**:
```bash
npm run test:coverage
# coverage/ ディレクトリにHTMLレポートが生成される
```

### テストの書き方

**Given-When-Thenパターン**:

```typescript
describe("TaskService", () => {
  describe("addTask", () => {
    it("正常なタイトルでタスクを作成できる", () => {
      // Given
      const storage = new MockStorage();
      const gitService = new MockGitService();
      const service = new TaskService(storage, gitService);

      // When
      const task = service.addTask("テストタスク");

      // Then
      expect(task.id).toBe(1);
      expect(task.title).toBe("テストタスク");
      expect(task.status).toBe("open");
      expect(task.priority).toBe("medium");
    });

    it("空のタイトルでValidationErrorをスローする", () => {
      // Given
      const service = new TaskService(new MockStorage(), new MockGitService());

      // When/Then
      expect(() => service.addTask("")).toThrow(ValidationError);
    });
  });
});
```

### モック・スタブの使用

**原則**:
- Storage（ファイルI/O）はモック化
- GitService（Git操作）はモック化
- TaskService（ビジネスロジック）は実装を使用

```typescript
class MockStorage {
  private store: TaskStore = { version: 1, nextId: 1, tasks: [] };

  load(): TaskStore {
    return structuredClone(this.store);
  }

  save(store: TaskStore): void {
    this.store = structuredClone(store);
  }
}

class MockGitService {
  private isRepo = true;
  private hasChanges = false;
  private branches: string[] = [];

  async isGitRepository(): Promise<boolean> {
    return this.isRepo;
  }

  async hasUncommittedChanges(): Promise<boolean> {
    return this.hasChanges;
  }

  async branchExists(branchName: string): Promise<boolean> {
    return this.branches.includes(branchName);
  }

  async createAndCheckoutBranch(branchName: string): Promise<void> {
    this.branches.push(branchName);
  }

  async checkoutBranch(_branchName: string): Promise<void> {}
  async mergeToMain(_branchName: string): Promise<void> {}
  async push(): Promise<void> {}
}
```

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] PRDの受け入れ条件を満たしているか
- [ ] エッジケース（0件、上限値、不正入力）が考慮されているか
- [ ] エラーハンドリングが適切か

**可読性**:
- [ ] 命名規則に従っているか
- [ ] 複雑なロジックに意図を示すコメントがあるか

**保守性**:
- [ ] レイヤー間の依存方向が正しいか（CLI→Service→Storage）
- [ ] 責務が明確に分離されているか
- [ ] ファイルサイズが300行以下か（300〜500行: リファクタリング検討、500行以上: 分割を強く推奨）
- [ ] async/awaitが適切に使われているか（awaitの漏れがないか）

**セキュリティ**:
- [ ] 入力値が検証されているか
- [ ] ブランチ名にシェル特殊文字が混入しないか

### レビューコメントの優先度

- `[必須]`: マージ前に必ず修正
- `[推奨]`: 修正が望ましい
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | 20.x LTS以上 | nvm または公式インストーラー |
| Git | 2.30以上 | OS付属またはパッケージマネージャー |
| npm | 10.x以上 | Node.jsに同梱 |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd taskcli

# 2. 依存関係のインストール
npm install

# 3. ビルド
npm run build

# 4. 動作確認
node dist/cli/index.js --help
```

### npmスクリプト

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint .",
    "format": "npx prettier --write .",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

> `prepare`スクリプトにより`npm install`時にhuskyが自動セットアップされ、pre-commitフックでlint-stagedが実行される。
