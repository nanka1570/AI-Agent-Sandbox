import { Task, TaskId, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types/task.js';
import { StorageService } from './storageService.js';

/**
 * Service for managing tasks - CRUD operations and business logic
 */
export class TaskService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Create a new task
   */
  async addTask(input: CreateTaskInput): Promise<Task> {
    const tasks = await this.storageService.readTasks();

    // Generate new ID (max existing ID + 1, or 1 if no tasks)
    const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;
    const newId = maxId + 1;

    const now = new Date();
    const newTask: Task = {
      id: newId,
      title: input.title.trim(),
      status: TaskStatus.OPEN,
      createdAt: now,
      updatedAt: now
    };

    const updatedTasks = [...tasks, newTask];
    await this.storageService.writeTasks(updatedTasks);

    return newTask;
  }

  /**
   * Get all tasks
   */
  async listTasks(): Promise<Task[]> {
    const tasks = await this.storageService.readTasks();
    // Sort by ID ascending
    return tasks.sort((a, b) => a.id - b.id);
  }

  /**
   * Get a specific task by ID
   */
  async getTask(id: TaskId): Promise<Task | null> {
    const tasks = await this.storageService.readTasks();
    return tasks.find(task => task.id === id) || null;
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(id: TaskId, status: TaskStatus): Promise<Task | null> {
    const tasks = await this.storageService.readTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      return null;
    }

    const now = new Date();
    const updatedTask = {
      ...tasks[taskIndex],
      status,
      updatedAt: now,
      completedAt: status === TaskStatus.COMPLETED ? now : tasks[taskIndex].completedAt
    };

    tasks[taskIndex] = updatedTask;
    await this.storageService.writeTasks(tasks);

    return updatedTask;
  }

  /**
   * Update a task
   */
  async updateTask(id: TaskId, input: UpdateTaskInput): Promise<Task | null> {
    const tasks = await this.storageService.readTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      return null;
    }

    const now = new Date();
    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...input,
      updatedAt: now,
      completedAt: input.status === TaskStatus.COMPLETED ? now : tasks[taskIndex].completedAt
    };

    tasks[taskIndex] = updatedTask;
    await this.storageService.writeTasks(tasks);

    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: TaskId): Promise<boolean> {
    const tasks = await this.storageService.readTasks();
    const initialCount = tasks.length;
    const filteredTasks = tasks.filter(task => task.id !== id);

    if (filteredTasks.length === initialCount) {
      return false; // Task not found
    }

    await this.storageService.writeTasks(filteredTasks);
    return true;
  }

  /**
   * Get active (in_progress) task
   */
  async getActiveTask(): Promise<Task | null> {
    const tasks = await this.storageService.readTasks();
    return tasks.find(task => task.status === TaskStatus.IN_PROGRESS) || null;
  }

  /**
   * Check if a task exists
   */
  async taskExists(id: TaskId): Promise<boolean> {
    const task = await this.getTask(id);
    return task !== null;
  }

  /**
   * Get task count by status
   */
  async getTaskCountByStatus(): Promise<Record<TaskStatus, number>> {
    const tasks = await this.storageService.readTasks();

    return {
      [TaskStatus.OPEN]: tasks.filter(t => t.status === TaskStatus.OPEN).length,
      [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      [TaskStatus.COMPLETED]: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      [TaskStatus.ARCHIVED]: tasks.filter(t => t.status === TaskStatus.ARCHIVED).length
    };
  }
}