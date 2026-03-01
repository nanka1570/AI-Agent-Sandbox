import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { formatTaskTable } from '../utils/formatter.js';
import { handleError } from '../error-handler.js';

export function registerListCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('list')
    .description('タスク一覧を表示する')
    .option('-a, --all', 'アーカイブ済みを含む全タスクを表示')
    .action((options: { all?: boolean }) => {
      try {
        const tasks = taskService.listTasks({ all: options.all });
        console.log(formatTaskTable(tasks));
      } catch (error) {
        handleError(error);
      }
    });
}
