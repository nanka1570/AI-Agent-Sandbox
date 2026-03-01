import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { parseTaskId } from '../utils/validation.js';
import { formatTaskDetail } from '../utils/formatter.js';
import { handleError } from '../error-handler.js';

export function registerShowCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('show')
    .description('タスクの詳細を表示する')
    .argument('<id>', 'タスクID')
    .action((idStr: string) => {
      try {
        const id = parseTaskId(idStr);
        const task = taskService.getTask(id);
        console.log(formatTaskDetail(task));
      } catch (error) {
        handleError(error);
      }
    });
}
