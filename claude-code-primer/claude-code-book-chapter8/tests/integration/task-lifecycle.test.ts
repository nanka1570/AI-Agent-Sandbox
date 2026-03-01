import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Storage } from '../../src/services/storage.js';
import { TaskService } from '../../src/services/task-service.js';
import { StatusTransitionError } from '../../src/types/task.js';

class MockGitService {
  private isRepo = true;
  private branches: string[] = [];

  async isGitRepository(): Promise<boolean> {
    return this.isRepo;
  }

  async hasUncommittedChanges(): Promise<boolean> {
    return false;
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

describe('タスクライフサイクル統合テスト', () => {
  let tmpDir: string;
  let storage: Storage;
  let gitService: MockGitService;
  let service: TaskService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskcli-int-'));
    storage = new Storage(tmpDir);
    gitService = new MockGitService();
    service = new TaskService(
      storage,
      gitService as unknown as ConstructorParameters<typeof TaskService>[1]
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('タスクの作成 → 一覧 → 開始 → 完了 → アーカイブの完全なライフサイクル', async () => {
    // 1. タスク作成
    const task = service.addTask('ユーザー認証機能の実装');
    expect(task.id).toBe(1);
    expect(task.status).toBe('open');

    // 2. タスク一覧確認
    const tasks = service.listTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('ユーザー認証機能の実装');

    // 3. タスク開始（ブランチ作成）
    const startResult = await service.startTask(1);
    expect(startResult.task.status).toBe('in_progress');
    expect(startResult.task.branch).toBe('feature/task-1');
    expect(startResult.branchCreated).toBe(true);

    // 4. タスク完了
    const completedTask = service.completeTask(1);
    expect(completedTask.status).toBe('completed');
    expect(completedTask.completedAt).not.toBeNull();

    // 5. タスクアーカイブ
    const archivedTask = service.archiveTask(1);
    expect(archivedTask.status).toBe('archived');

    // 6. デフォルトの一覧にはアーカイブ済みが含まれない
    const activeTasks = service.listTasks();
    expect(activeTasks).toHaveLength(0);

    // 7. --allで全タスクが見える
    const allTasks = service.listTasks({ all: true });
    expect(allTasks).toHaveLength(1);
    expect(allTasks[0].status).toBe('archived');
  });

  it('タスクの作成 → 直接完了（open → completed）', () => {
    service.addTask('簡単なタスク');
    const task = service.completeTask(1);
    expect(task.status).toBe('completed');
  });

  it('タスクの作成 → 削除', () => {
    service.addTask('不要なタスク');
    service.deleteTask(1);
    const tasks = service.listTasks();
    expect(tasks).toHaveLength(0);
  });

  it('複数タスクの管理', async () => {
    service.addTask('タスクA');
    service.addTask('タスクB');
    service.addTask('タスクC');

    await service.startTask(1);
    service.completeTask(2);

    const tasks = service.listTasks();
    expect(tasks).toHaveLength(3);

    const statusMap = Object.fromEntries(
      tasks.map((t) => [t.title, t.status])
    );
    expect(statusMap['タスクA']).toBe('in_progress');
    expect(statusMap['タスクB']).toBe('completed');
    expect(statusMap['タスクC']).toBe('open');
  });

  it('禁止されたステータス遷移がエラーになる', async () => {
    service.addTask('テスト');
    await service.startTask(1);

    // in_progress → archived は禁止
    expect(() => service.archiveTask(1)).toThrow(
      StatusTransitionError
    );
  });

  it('データが永続化されている', () => {
    service.addTask('永続化テスト');

    // 新しいサービスインスタンスで読み込み
    const newService = new TaskService(
      storage,
      gitService as unknown as ConstructorParameters<typeof TaskService>[1]
    );
    const task = newService.getTask(1);
    expect(task.title).toBe('永続化テスト');
  });
});
