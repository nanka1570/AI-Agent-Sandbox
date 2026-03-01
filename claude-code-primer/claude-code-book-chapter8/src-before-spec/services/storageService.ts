import { promises as fs } from 'fs';
import { join } from 'path';
import { Task } from '../types/task.js';

/**
 * Storage service for managing task data persistence
 */
export class StorageService {
  private readonly dataDir: string;
  private readonly tasksFilePath: string;
  private readonly tempFilePath: string;

  constructor(basePath: string = process.cwd()) {
    this.dataDir = join(basePath, '.task');
    this.tasksFilePath = join(this.dataDir, 'tasks.json');
    this.tempFilePath = join(this.dataDir, 'tasks.tmp.json');
  }

  /**
   * Ensure the data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create data directory: ${error}`);
    }
  }

  /**
   * Read all tasks from storage
   */
  async readTasks(): Promise<Task[]> {
    try {
      await this.ensureDataDirectory();

      // Check if tasks file exists
      try {
        await fs.access(this.tasksFilePath);
      } catch {
        // File doesn't exist, return empty array
        return [];
      }

      const data = await fs.readFile(this.tasksFilePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      return parsed.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      }));
    } catch (error) {
      throw new Error(`Failed to read tasks: ${error}`);
    }
  }

  /**
   * Write all tasks to storage using atomic write operation
   */
  async writeTasks(tasks: Task[]): Promise<void> {
    try {
      await this.ensureDataDirectory();

      // Convert Date objects to ISO strings for JSON serialization
      const serializable = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        completedAt: task.completedAt?.toISOString()
      }));

      // Atomic write: write to temp file first, then rename
      await fs.writeFile(
        this.tempFilePath,
        JSON.stringify(serializable, null, 2),
        'utf-8'
      );

      await fs.rename(this.tempFilePath, this.tasksFilePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(this.tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to write tasks: ${error}`);
    }
  }

  /**
   * Get the data directory path
   */
  getDataDirectory(): string {
    return this.dataDir;
  }

  /**
   * Check if storage is properly initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.dataDir);
      return true;
    } catch {
      return false;
    }
  }
}