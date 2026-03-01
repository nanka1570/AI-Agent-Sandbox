import { describe, it, expect, beforeEach } from 'vitest';
import {
  type TaskStore,
  TaskNotFoundError,
  ValidationError,
  StatusTransitionError,
} from '../../../src/types/task.js';
import { TaskService } from '../../../src/services/task-service.js';

class MockStorage {
  private store: TaskStore = { version: 1, nextId: 1, tasks: [] };

  load(): TaskStore {
    return structuredClone(this.store);
  }

  save(store: TaskStore): void {
    this.store = structuredClone(store);
  }

  exists(): boolean {
    return true;
  }

  initialize(): void {}
}

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

  setIsRepo(val: boolean): void {
    this.isRepo = val;
  }

  addBranch(name: string): void {
    this.branches.push(name);
  }
}

describe('TaskService', () => {
  let storage: MockStorage;
  let gitService: MockGitService;
  let service: TaskService;

  beforeEach(() => {
    storage = new MockStorage();
    gitService = new MockGitService();
    service = new TaskService(
      storage as unknown as ConstructorParameters<typeof TaskService>[0],
      gitService as unknown as ConstructorParameters<typeof TaskService>[1]
    );
  });

  describe('addTask', () => {
    it('正常なタイトルでタスクを作成できる', () => {
      const task = service.addTask('テストタスク');
      expect(task.id).toBe(1);
      expect(task.title).toBe('テストタスク');
      expect(task.status).toBe('open');
      expect(task.priority).toBe('medium');
      expect(task.branch).toBeNull();
      expect(task.completedAt).toBeNull();
    });

    it('連続して作成するとIDが増加する', () => {
      const task1 = service.addTask('タスク1');
      const task2 = service.addTask('タスク2');
      expect(task1.id).toBe(1);
      expect(task2.id).toBe(2);
    });

    it('空のタイトルでValidationErrorをスローする', () => {
      expect(() => service.addTask('')).toThrow(ValidationError);
    });

    it('空白のみのタイトルでValidationErrorをスローする', () => {
      expect(() => service.addTask('   ')).toThrow(ValidationError);
    });

    it('200文字を超えるタイトルでValidationErrorをスローする', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => service.addTask(longTitle)).toThrow(ValidationError);
    });

    it('タイトルの前後の空白をトリムする', () => {
      const task = service.addTask('  タスク  ');
      expect(task.title).toBe('タスク');
    });
  });

  describe('listTasks', () => {
    it('デフォルトではarchived以外のタスクを返す', () => {
      service.addTask('タスク1');
      service.addTask('タスク2');
      const task3 = service.addTask('タスク3');
      service.completeTask(task3.id);
      service.archiveTask(task3.id);

      const tasks = service.listTasks();
      expect(tasks).toHaveLength(2);
      expect(tasks.every((t) => t.status !== 'archived')).toBe(true);
    });

    it('allオプションで全タスクを返す', () => {
      service.addTask('タスク1');
      const task2 = service.addTask('タスク2');
      service.completeTask(task2.id);
      service.archiveTask(task2.id);

      const tasks = service.listTasks({ all: true });
      expect(tasks).toHaveLength(2);
    });

    it('タスクが0件の場合は空配列を返す', () => {
      const tasks = service.listTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('IDでタスクを取得できる', () => {
      service.addTask('テストタスク');
      const task = service.getTask(1);
      expect(task.title).toBe('テストタスク');
    });

    it('存在しないIDでTaskNotFoundErrorをスローする', () => {
      expect(() => service.getTask(999)).toThrow(TaskNotFoundError);
    });
  });

  describe('startTask', () => {
    it('タスクを開始してステータスをin_progressに変更する', async () => {
      service.addTask('新機能の開発');
      const result = await service.startTask(1);
      expect(result.task.status).toBe('in_progress');
      expect(result.task.branch).toBe('feature/task-1');
    });

    it('ブランチが作成された場合branchCreatedがtrue', async () => {
      service.addTask('Feature work');
      const result = await service.startTask(1);
      expect(result.branchCreated).toBe(true);
    });

    it('既存のブランチがある場合はチェックアウトのみ', async () => {
      service.addTask('Feature work');
      gitService.addBranch('feature/task-1-feature-work');
      const result = await service.startTask(1);
      expect(result.branchCreated).toBe(false);
    });

    it('Gitリポジトリ外では警告を返しブランチはnull', async () => {
      service.addTask('テスト');
      gitService.setIsRepo(false);
      const result = await service.startTask(1);
      expect(result.gitWarning).toBeDefined();
      expect(result.task.status).toBe('in_progress');
      expect(result.task.branch).toBeNull();
    });

    it('存在しないIDでTaskNotFoundErrorをスローする', async () => {
      await expect(service.startTask(999)).rejects.toThrow(
        TaskNotFoundError
      );
    });

    it('completed状態からの開始はStatusTransitionErrorをスローする', async () => {
      service.addTask('テスト');
      service.completeTask(1);
      await expect(service.startTask(1)).rejects.toThrow(
        StatusTransitionError
      );
    });
  });

  describe('completeTask', () => {
    it('openタスクを直接完了できる', () => {
      service.addTask('テスト');
      const task = service.completeTask(1);
      expect(task.status).toBe('completed');
      expect(task.completedAt).not.toBeNull();
    });

    it('in_progressタスクを完了できる', async () => {
      service.addTask('テスト');
      await service.startTask(1);
      const task = service.completeTask(1);
      expect(task.status).toBe('completed');
    });

    it('archived状態からの完了はStatusTransitionErrorをスローする', () => {
      service.addTask('テスト');
      service.completeTask(1);
      service.archiveTask(1);
      expect(() => service.completeTask(1)).toThrow(
        StatusTransitionError
      );
    });

    it('存在しないIDでTaskNotFoundErrorをスローする', () => {
      expect(() => service.completeTask(999)).toThrow(
        TaskNotFoundError
      );
    });
  });

  describe('deleteTask', () => {
    it('タスクを削除できる', () => {
      service.addTask('テスト');
      service.deleteTask(1);
      expect(() => service.getTask(1)).toThrow(TaskNotFoundError);
    });

    it('存在しないIDでTaskNotFoundErrorをスローする', () => {
      expect(() => service.deleteTask(999)).toThrow(
        TaskNotFoundError
      );
    });
  });

  describe('archiveTask', () => {
    it('completedタスクをアーカイブできる', () => {
      service.addTask('テスト');
      service.completeTask(1);
      const task = service.archiveTask(1);
      expect(task.status).toBe('archived');
    });

    it('openタスクをアーカイブできる', () => {
      service.addTask('テスト');
      const task = service.archiveTask(1);
      expect(task.status).toBe('archived');
    });

    it('in_progress状態からのアーカイブはStatusTransitionErrorをスローする', async () => {
      service.addTask('テスト');
      await service.startTask(1);
      expect(() => service.archiveTask(1)).toThrow(
        StatusTransitionError
      );
    });

    it('存在しないIDでTaskNotFoundErrorをスローする', () => {
      expect(() => service.archiveTask(999)).toThrow(
        TaskNotFoundError
      );
    });
  });
});
