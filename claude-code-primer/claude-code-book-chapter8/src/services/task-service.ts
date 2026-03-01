import {
  type Task,
  type TaskStatus,
  ALLOWED_TRANSITIONS,
  MAX_TITLE_LENGTH,
  TaskNotFoundError,
  ValidationError,
  StatusTransitionError,
} from '../types/task.js';
import { generateBranchName } from '../utils/branch-name.js';
import type { Storage } from './storage.js';
import type { GitService } from './git-service.js';
const DEFAULT_PRIORITY = 'medium' as const;
const DEFAULT_STATUS = 'open' as const;

export interface StartTaskResult {
  task: Task;
  branchCreated: boolean;
  gitWarning?: string;
  hasUncommittedChanges?: boolean;
}

export class TaskService {
  constructor(
    private storage: Storage,
    private gitService: GitService
  ) {}

  addTask(title: string): Task {
    if (!title || title.trim().length === 0) {
      throw new ValidationError(
        'タイトルは1〜200文字で入力してください'
      );
    }
    if (title.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(
        'タイトルは1〜200文字で入力してください'
      );
    }

    const store = this.storage.load();
    const now = new Date().toISOString();
    const task: Task = {
      id: store.nextId,
      title: title.trim(),
      status: DEFAULT_STATUS,
      priority: DEFAULT_PRIORITY,
      dueDate: null,
      branch: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    store.nextId++;
    store.tasks.push(task);
    this.storage.save(store);
    return task;
  }

  listTasks(options?: { all?: boolean }): Task[] {
    const store = this.storage.load();
    if (options?.all) {
      return store.tasks;
    }
    return store.tasks.filter((t) => t.status !== 'archived');
  }

  getTask(id: number): Task {
    const store = this.storage.load();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }
    return task;
  }

  async startTask(id: number): Promise<StartTaskResult> {
    const store = this.storage.load();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    this.validateTransition(task.status, 'in_progress');

    const branchName = generateBranchName(task.id, task.title);
    let branchCreated = false;
    let gitWarning: string | undefined;

    let hasUncommittedChanges = false;
    const isRepo = await this.gitService.isGitRepository();
    if (isRepo) {
      hasUncommittedChanges =
        await this.gitService.hasUncommittedChanges();
      const exists = await this.gitService.branchExists(branchName);
      if (exists) {
        await this.gitService.checkoutBranch(branchName);
      } else {
        await this.gitService.createAndCheckoutBranch(branchName);
        branchCreated = true;
      }
    } else {
      gitWarning =
        'Gitリポジトリが見つかりません。ブランチ連携をスキップします';
    }

    task.status = 'in_progress';
    task.branch = isRepo ? branchName : null;
    task.updatedAt = new Date().toISOString();
    this.storage.save(store);

    return {
      task,
      branchCreated,
      gitWarning,
      hasUncommittedChanges: hasUncommittedChanges || undefined,
    };
  }

  completeTask(id: number): Task {
    const store = this.storage.load();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    this.validateTransition(task.status, 'completed');

    const now = new Date().toISOString();
    task.status = 'completed';
    task.updatedAt = now;
    task.completedAt = now;
    this.storage.save(store);
    return task;
  }

  deleteTask(id: number): void {
    const store = this.storage.load();
    const index = store.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new TaskNotFoundError(id);
    }
    store.tasks.splice(index, 1);
    this.storage.save(store);
  }

  archiveTask(id: number): Task {
    const store = this.storage.load();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    this.validateTransition(task.status, 'archived');

    task.status = 'archived';
    task.updatedAt = new Date().toISOString();
    this.storage.save(store);
    return task;
  }

  private validateTransition(
    current: TaskStatus,
    target: TaskStatus
  ): void {
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(target)) {
      throw new StatusTransitionError(current, target);
    }
  }
}
