import { Task, TaskId, TaskStatus } from '../types/task.js';
import { TaskService } from './taskService.js';
import { GitService, GitError } from './gitService.js';
import { generateBranchName } from '../utils/slugify.js';

/**
 * Error class for task workflow operations
 */
export class TaskWorkflowError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TaskWorkflowError';
  }
}

/**
 * Service for managing task workflows that integrate tasks with Git operations
 */
export class TaskWorkflow {
  private taskService: TaskService;
  private gitService: GitService;

  constructor(taskService: TaskService, gitService: GitService) {
    this.taskService = taskService;
    this.gitService = gitService;
  }

  /**
   * Start working on a task - creates branch and updates status
   */
  async startTask(taskId: TaskId): Promise<{ task: Task; branchName: string }> {
    // Step 1: Validate task exists and is startable
    const task = await this.taskService.getTask(taskId);
    if (!task) {
      throw new TaskWorkflowError(`Task #${taskId} not found`);
    }

    if (task.status !== TaskStatus.OPEN) {
      throw new TaskWorkflowError(
        `Task #${taskId} cannot be started. Current status: ${task.status}. Only 'open' tasks can be started.`
      );
    }

    // Step 2: Check for existing in_progress tasks
    const activeTask = await this.taskService.getActiveTask();
    if (activeTask && activeTask.id !== taskId) {
      throw new TaskWorkflowError(
        `Cannot start task #${taskId}. Task #${activeTask.id} "${activeTask.title}" is already in progress.`
      );
    }

    // Step 3: Ensure we're in a Git repository
    const isGitRepo = await this.gitService.isGitRepository();
    if (!isGitRepo) {
      throw new TaskWorkflowError(
        'This directory is not a Git repository. TaskCLI requires Git integration.'
      );
    }

    // Step 4: Generate branch name
    const branchName = generateBranchName(taskId, task.title);

    // Step 5: Check if branch already exists
    const branchExists = await this.gitService.branchExists(branchName);
    if (branchExists) {
      throw new TaskWorkflowError(
        `Branch '${branchName}' already exists. Please delete it first or use a different task title.`
      );
    }

    // Step 6: Update task status to in_progress (before Git operations for rollback)
    let updatedTask: Task | null = null;
    try {
      updatedTask = await this.taskService.updateTask(taskId, {
        status: TaskStatus.IN_PROGRESS,
        branch: branchName
      });

      if (!updatedTask) {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      throw new TaskWorkflowError(
        `Failed to update task #${taskId} status: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Step 7: Create and switch to Git branch
    try {
      await this.gitService.createBranch(branchName);
    } catch (error) {
      // Rollback: revert task status to open
      try {
        await this.taskService.updateTask(taskId, {
          status: TaskStatus.OPEN,
          branch: undefined
        });
      } catch (rollbackError) {
        // Log rollback failure but don't override original error
        console.error('Failed to rollback task status:', rollbackError);
      }

      if (error instanceof GitError) {
        throw new TaskWorkflowError(
          `Git operation failed: ${error.message}`,
          error
        );
      }

      throw new TaskWorkflowError(
        `Failed to create Git branch '${branchName}': ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    return {
      task: updatedTask,
      branchName
    };
  }

  /**
   * Complete a task - updates status to completed
   */
  async completeTask(taskId: TaskId): Promise<Task> {
    // Step 1: Validate task exists and is completable
    const task = await this.taskService.getTask(taskId);
    if (!task) {
      throw new TaskWorkflowError(`Task #${taskId} not found`);
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new TaskWorkflowError(
        `Task #${taskId} cannot be completed. Current status: ${task.status}. Only 'in_progress' tasks can be completed.`
      );
    }

    // Step 2: Update task status to completed
    try {
      const updatedTask = await this.taskService.updateTaskStatus(taskId, TaskStatus.COMPLETED);

      if (!updatedTask) {
        throw new Error('Failed to update task status');
      }

      return updatedTask;
    } catch (error) {
      throw new TaskWorkflowError(
        `Failed to complete task #${taskId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get current workflow status
   */
  async getWorkflowStatus(): Promise<{
    activeTask: Task | null;
    currentBranch: string | null;
    isGitRepo: boolean;
    branchSyncStatus: 'synced' | 'branch_mismatch' | 'no_active_task' | 'not_git_repo';
  }> {
    const isGitRepo = await this.gitService.isGitRepository();
    const activeTask = await this.taskService.getActiveTask();

    let currentBranch: string | null = null;
    if (isGitRepo) {
      try {
        currentBranch = await this.gitService.getCurrentBranch();
      } catch {
        // Ignore error, currentBranch remains null
      }
    }

    let branchSyncStatus: 'synced' | 'branch_mismatch' | 'no_active_task' | 'not_git_repo';

    if (!isGitRepo) {
      branchSyncStatus = 'not_git_repo';
    } else if (!activeTask) {
      branchSyncStatus = 'no_active_task';
    } else if (activeTask.branch === currentBranch) {
      branchSyncStatus = 'synced';
    } else {
      branchSyncStatus = 'branch_mismatch';
    }

    return {
      activeTask,
      currentBranch,
      isGitRepo,
      branchSyncStatus
    };
  }

  /**
   * Check if a task can be started
   */
  async canStartTask(taskId: TaskId): Promise<{
    canStart: boolean;
    reason?: string;
  }> {
    try {
      // Check if task exists
      const task = await this.taskService.getTask(taskId);
      if (!task) {
        return { canStart: false, reason: `Task #${taskId} not found` };
      }

      // Check task status
      if (task.status !== TaskStatus.OPEN) {
        return { canStart: false, reason: `Task is ${task.status}, not open` };
      }

      // Check for active tasks
      const activeTask = await this.taskService.getActiveTask();
      if (activeTask && activeTask.id !== taskId) {
        return { canStart: false, reason: `Task #${activeTask.id} is already active` };
      }

      // Check Git repository
      const isGitRepo = await this.gitService.isGitRepository();
      if (!isGitRepo) {
        return { canStart: false, reason: 'Not a Git repository' };
      }

      // Check branch name conflicts
      const branchName = generateBranchName(taskId, task.title);
      const branchExists = await this.gitService.branchExists(branchName);
      if (branchExists) {
        return { canStart: false, reason: `Branch '${branchName}' already exists` };
      }

      return { canStart: true };
    } catch (error) {
      return {
        canStart: false,
        reason: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if a task can be completed
   */
  async canCompleteTask(taskId: TaskId): Promise<{
    canComplete: boolean;
    reason?: string;
  }> {
    try {
      // Check if task exists
      const task = await this.taskService.getTask(taskId);
      if (!task) {
        return { canComplete: false, reason: `Task #${taskId} not found` };
      }

      // Check task status
      if (task.status !== TaskStatus.IN_PROGRESS) {
        return { canComplete: false, reason: `Task is ${task.status}, not in progress` };
      }

      return { canComplete: true };
    } catch (error) {
      return {
        canComplete: false,
        reason: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}