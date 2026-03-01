/**
 * Task ID type - positive integer
 */
export type TaskId = number;

/**
 * Task status enumeration
 */
export enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

/**
 * Task interface representing a single task
 */
export interface Task {
  /**
   * Unique identifier for the task
   */
  id: TaskId;

  /**
   * Task title/description
   */
  title: string;

  /**
   * Current status of the task
   */
  status: TaskStatus;

  /**
   * Associated git branch name (if any)
   */
  branch?: string;

  /**
   * Timestamp when the task was created
   */
  createdAt: Date;

  /**
   * Timestamp when the task was last updated
   */
  updatedAt: Date;

  /**
   * Timestamp when the task was completed (if applicable)
   */
  completedAt?: Date;
}

/**
 * Partial task for creation - omits computed fields
 */
export interface CreateTaskInput {
  title: string;
}

/**
 * Partial task for updates
 */
export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  branch?: string;
}