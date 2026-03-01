export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'archived';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  branch: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TaskStore {
  version: 1;
  nextId: number;
  tasks: Task[];
}

export const MAX_TITLE_LENGTH = 200;

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ['in_progress', 'completed', 'archived'],
  in_progress: ['completed'],
  completed: ['archived'],
  archived: [],
};

export class TaskNotFoundError extends Error {
  constructor(public taskId: number) {
    super(`タスク #${taskId} が見つかりません`);
    this.name = 'TaskNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StatusTransitionError extends Error {
  constructor(
    public currentStatus: TaskStatus,
    public targetStatus: TaskStatus
  ) {
    super(
      `ステータスを ${currentStatus} から ${targetStatus} に変更することはできません`
    );
    this.name = 'StatusTransitionError';
  }
}
