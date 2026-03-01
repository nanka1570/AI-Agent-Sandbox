import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { validateTitle } from '../utils/validation.js';
import { handleError } from '../error-handler.js';

export function registerAddCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('add')
    .description('タスクを作成する')
    .argument('<title>', 'タスクのタイトル')
    .action((title: string) => {
      try {
        const validTitle = validateTitle(title);
        const task = taskService.addTask(validTitle);
        console.log(`タスクを作成しました (ID: ${task.id})`);
      } catch (error) {
        handleError(error);
      }
    });
}
