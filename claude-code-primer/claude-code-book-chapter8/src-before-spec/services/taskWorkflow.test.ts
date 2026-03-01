import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TaskWorkflow, TaskWorkflowError } from './taskWorkflow.js';
import { TaskService } from './taskService.js';
import { StorageService } from './storageService.js';
import { GitService } from './gitService.js';
import { TaskStatus } from '../types/task.js';

// Mock GitService to avoid actual Git operations in tests
vi.mock('./gitService.js');

describe('TaskWorkflow', () => {
  let taskWorkflow: TaskWorkflow;
  let taskService: TaskService;
  let storageService: StorageService;
  let gitService: GitService;
  let testDataDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDataDir = join(process.cwd(), '.workflow-test-' + Date.now());
    storageService = new StorageService(testDataDir);
    taskService = new TaskService(storageService);

    // Create mocked GitService
    gitService = new GitService() as any;

    // Setup default mocks
    vi.mocked(gitService.isGitRepository).mockResolvedValue(true);
    vi.mocked(gitService.branchExists).mockResolvedValue(false);
    vi.mocked(gitService.createBranch).mockResolvedValue();
    vi.mocked(gitService.getCurrentBranch).mockResolvedValue('main');

    taskWorkflow = new TaskWorkflow(taskService, gitService);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    vi.clearAllMocks();
  });

  describe('startTask', () => {
    it('正常にタスクを開始できる', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskWorkflow.startTask(task.id);

      // Then: 検証
      expect(result.task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.branchName).toBe('feature/task-1-test-task');
      expect(vi.mocked(gitService.createBranch)).toHaveBeenCalledWith('feature/task-1-test-task');
    });

    it('存在しないタスクを開始しようとするとエラーをスローする', async () => {
      // Given: 準備
      const nonExistentTaskId = 999;

      // When/Then: 実行と検証
      await expect(taskWorkflow.startTask(nonExistentTaskId))
        .rejects
        .toThrow(TaskWorkflowError);
    });

    it('既にin_progressのタスクがあると新しいタスクを開始できない', async () => {
      // Given: 準備
      const task1 = await taskService.addTask({ title: 'First task' });
      const task2 = await taskService.addTask({ title: 'Second task' });

      // 最初のタスクを開始
      await taskWorkflow.startTask(task1.id);

      // When/Then: 実行と検証
      await expect(taskWorkflow.startTask(task2.id))
        .rejects
        .toThrow(TaskWorkflowError);
    });

    it('Gitリポジトリでない場合はエラーをスローする', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      vi.mocked(gitService.isGitRepository).mockResolvedValue(false);

      // When/Then: 実行と検証
      await expect(taskWorkflow.startTask(task.id))
        .rejects
        .toThrow(TaskWorkflowError);
    });

    it('ブランチが既に存在する場合はエラーをスローする', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      vi.mocked(gitService.branchExists).mockResolvedValue(true);

      // When/Then: 実行と検証
      await expect(taskWorkflow.startTask(task.id))
        .rejects
        .toThrow(TaskWorkflowError);
    });

    it('Git操作が失敗した場合はタスクステータスをロールバックする', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      vi.mocked(gitService.createBranch).mockRejectedValue(new Error('Git error'));

      // When: 実行
      await expect(taskWorkflow.startTask(task.id))
        .rejects
        .toThrow(TaskWorkflowError);

      // Then: 検証 - タスクのステータスがOPENに戻っていることを確認
      const updatedTask = await taskService.getTask(task.id);
      expect(updatedTask!.status).toBe(TaskStatus.OPEN);
      expect(updatedTask!.branch).toBeUndefined();
    });

    it('completedステータスのタスクは開始できない', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskService.updateTaskStatus(task.id, TaskStatus.COMPLETED);

      // When/Then: 実行と検証
      await expect(taskWorkflow.startTask(task.id))
        .rejects
        .toThrow(TaskWorkflowError);
    });
  });

  describe('completeTask', () => {
    it('正常にタスクを完了できる', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskService.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

      // When: 実行
      const result = await taskWorkflow.completeTask(task.id);

      // Then: 検証
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('存在しないタスクを完了しようとするとエラーをスローする', async () => {
      // Given: 準備
      const nonExistentTaskId = 999;

      // When/Then: 実行と検証
      await expect(taskWorkflow.completeTask(nonExistentTaskId))
        .rejects
        .toThrow(TaskWorkflowError);
    });

    it('in_progressでないタスクは完了できない', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      // タスクはOPENのまま

      // When/Then: 実行と検証
      await expect(taskWorkflow.completeTask(task.id))
        .rejects
        .toThrow(TaskWorkflowError);
    });
  });

  describe('getWorkflowStatus', () => {
    it('アクティブなタスクがない場合の状態を正しく返す', async () => {
      // Given: 準備
      // (アクティブなタスクなし)

      // When: 実行
      const status = await taskWorkflow.getWorkflowStatus();

      // Then: 検証
      expect(status.activeTask).toBeNull();
      expect(status.currentBranch).toBe('main');
      expect(status.isGitRepo).toBe(true);
      expect(status.branchSyncStatus).toBe('no_active_task');
    });

    it('アクティブなタスクがある場合の状態を正しく返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskWorkflow.startTask(task.id);
      vi.mocked(gitService.getCurrentBranch).mockResolvedValue('feature/task-1-test-task');

      // When: 実行
      const status = await taskWorkflow.getWorkflowStatus();

      // Then: 検証
      expect(status.activeTask).not.toBeNull();
      expect(status.activeTask!.id).toBe(task.id);
      expect(status.currentBranch).toBe('feature/task-1-test-task');
      expect(status.branchSyncStatus).toBe('synced');
    });

    it('ブランチが同期していない場合の状態を正しく返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskWorkflow.startTask(task.id);
      vi.mocked(gitService.getCurrentBranch).mockResolvedValue('different-branch');

      // When: 実行
      const status = await taskWorkflow.getWorkflowStatus();

      // Then: 検証
      expect(status.branchSyncStatus).toBe('branch_mismatch');
    });
  });

  describe('canStartTask', () => {
    it('開始可能なタスクの場合はtrueを返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });

      // When: 実行
      const result = await taskWorkflow.canStartTask(task.id);

      // Then: 検証
      expect(result.canStart).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('存在しないタスクの場合はfalseと理由を返す', async () => {
      // Given: 準備
      const nonExistentTaskId = 999;

      // When: 実行
      const result = await taskWorkflow.canStartTask(nonExistentTaskId);

      // Then: 検証
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('completedタスクの場合はfalseと理由を返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskService.updateTaskStatus(task.id, TaskStatus.COMPLETED);

      // When: 実行
      const result = await taskWorkflow.canStartTask(task.id);

      // Then: 検証
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('not open');
    });

    it('アクティブなタスクがある場合はfalseと理由を返す', async () => {
      // Given: 準備
      const task1 = await taskService.addTask({ title: 'Active task' });
      const task2 = await taskService.addTask({ title: 'New task' });
      await taskService.updateTaskStatus(task1.id, TaskStatus.IN_PROGRESS);

      // When: 実行
      const result = await taskWorkflow.canStartTask(task2.id);

      // Then: 検証
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('already active');
    });
  });

  describe('canCompleteTask', () => {
    it('完了可能なタスクの場合はtrueを返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      await taskService.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

      // When: 実行
      const result = await taskWorkflow.canCompleteTask(task.id);

      // Then: 検証
      expect(result.canComplete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('存在しないタスクの場合はfalseと理由を返す', async () => {
      // Given: 準備
      const nonExistentTaskId = 999;

      // When: 実行
      const result = await taskWorkflow.canCompleteTask(nonExistentTaskId);

      // Then: 検証
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('in_progressでないタスクの場合はfalseと理由を返す', async () => {
      // Given: 準備
      const task = await taskService.addTask({ title: 'Test task' });
      // タスクはOPENのまま

      // When: 実行
      const result = await taskWorkflow.canCompleteTask(task.id);

      // Then: 検証
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('not in progress');
    });
  });
});