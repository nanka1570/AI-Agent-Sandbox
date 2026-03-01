import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TaskService } from './taskService.js';
import { StorageService } from './storageService.js';
import { TaskStatus } from '../types/task.js';

describe('TaskService', () => {
  let taskService: TaskService;
  let storageService: StorageService;
  let testDataDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDataDir = join(process.cwd(), '.task-test-' + Date.now());
    storageService = new StorageService(testDataDir);
    taskService = new TaskService(storageService);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('addTask', () => {
    it('正の数を足すと正しい結果が返る', async () => {
      // Given: 準備
      const input = { title: 'Test task' };

      // When: 実行
      const result = await taskService.addTask(input);

      // Then: 検証
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test task');
      expect(result.status).toBe(TaskStatus.OPEN);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('複数のタスクを作成すると連続したIDが割り当てられる', async () => {
      // Given: 準備
      const input1 = { title: 'First task' };
      const input2 = { title: 'Second task' };

      // When: 実行
      const task1 = await taskService.addTask(input1);
      const task2 = await taskService.addTask(input2);

      // Then: 検証
      expect(task1.id).toBe(1);
      expect(task2.id).toBe(2);
    });

    it('タイトルの前後の空白が自動で削除される', async () => {
      // Given: 準備
      const input = { title: '  Test task with spaces  ' };

      // When: 実行
      const result = await taskService.addTask(input);

      // Then: 検証
      expect(result.title).toBe('Test task with spaces');
    });
  });

  describe('listTasks', () => {
    it('タスクがない場合は空の配列を返す', async () => {
      // Given: 準備
      // (タスクが存在しない状態)

      // When: 実行
      const result = await taskService.listTasks();

      // Then: 検証
      expect(result).toEqual([]);
    });

    it('タスクが複数ある場合はIDの昇順でソートして返す', async () => {
      // Given: 準備
      await taskService.addTask({ title: 'First task' });
      await taskService.addTask({ title: 'Second task' });
      await taskService.addTask({ title: 'Third task' });

      // When: 実行
      const result = await taskService.listTasks();

      // Then: 検証
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });
  });

  describe('getTask', () => {
    it('存在するタスクIDの場合はタスクを返す', async () => {
      // Given: 準備
      const createdTask = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskService.getTask(createdTask.id);

      // Then: 検証
      expect(result).not.toBeNull();
      expect(result!.id).toBe(createdTask.id);
      expect(result!.title).toBe('Test task');
    });

    it('存在しないタスクIDの場合はnullを返す', async () => {
      // Given: 準備
      // (タスクが存在しない状態)

      // When: 実行
      const result = await taskService.getTask(999);

      // Then: 検証
      expect(result).toBeNull();
    });
  });

  describe('updateTaskStatus', () => {
    it('存在するタスクのステータスを更新できる', async () => {
      // Given: 準備
      const createdTask = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskService.updateTaskStatus(createdTask.id, TaskStatus.IN_PROGRESS);

      // Then: 検証
      expect(result).not.toBeNull();
      expect(result!.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result!.updatedAt.getTime()).toBeGreaterThan(createdTask.updatedAt.getTime());
    });

    it('タスクをCOMPLETEDに更新すると完了日時が設定される', async () => {
      // Given: 準備
      const createdTask = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskService.updateTaskStatus(createdTask.id, TaskStatus.COMPLETED);

      // Then: 検証
      expect(result).not.toBeNull();
      expect(result!.status).toBe(TaskStatus.COMPLETED);
      expect(result!.completedAt).toBeInstanceOf(Date);
    });

    it('存在しないタスクの場合はnullを返す', async () => {
      // Given: 準備
      // (タスクが存在しない状態)

      // When: 実行
      const result = await taskService.updateTaskStatus(999, TaskStatus.IN_PROGRESS);

      // Then: 検証
      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('存在するタスクを削除できる', async () => {
      // Given: 準備
      const createdTask = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskService.deleteTask(createdTask.id);

      // Then: 検証
      expect(result).toBe(true);

      // タスクが実際に削除されているか確認
      const deletedTask = await taskService.getTask(createdTask.id);
      expect(deletedTask).toBeNull();
    });

    it('存在しないタスクの場合はfalseを返す', async () => {
      // Given: 準備
      // (タスクが存在しない状態)

      // When: 実行
      const result = await taskService.deleteTask(999);

      // Then: 検証
      expect(result).toBe(false);
    });
  });

  describe('getActiveTask', () => {
    it('IN_PROGRESSのタスクがない場合はnullを返す', async () => {
      // Given: 準備
      await taskService.addTask({ title: 'Open task' });

      // When: 実行
      const result = await taskService.getActiveTask();

      // Then: 検証
      expect(result).toBeNull();
    });

    it('IN_PROGRESSのタスクがある場合はそのタスクを返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskService.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

      // When: 実行
      const result = await taskService.getActiveTask();

      // Then: 検証
      expect(result).not.toBeNull();
      expect(result!.id).toBe(task.id);
      expect(result!.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('getTaskCountByStatus', () => {
    it('各ステータスのタスク数を正しく取得できる', async () => {
      // Given: 準備
      await taskService.addTask({ title: 'Open task 1' });
      await taskService.addTask({ title: 'Open task 2' });

      const task3 = await taskService.addTask({ title: 'In progress task' });
      await taskService.updateTaskStatus(task3.id, TaskStatus.IN_PROGRESS);

      const task4 = await taskService.addTask({ title: 'Completed task' });
      await taskService.updateTaskStatus(task4.id, TaskStatus.COMPLETED);

      // When: 実行
      const result = await taskService.getTaskCountByStatus();

      // Then: 検証
      expect(result[TaskStatus.OPEN]).toBe(2);
      expect(result[TaskStatus.IN_PROGRESS]).toBe(1);
      expect(result[TaskStatus.COMPLETED]).toBe(1);
      expect(result[TaskStatus.ARCHIVED]).toBe(0);
    });
  });
});