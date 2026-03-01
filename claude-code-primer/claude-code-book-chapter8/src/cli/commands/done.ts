import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { parseTaskId } from '../utils/validation.js';
import { handleError } from '../error-handler.js';

export function registerDoneCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('done')
    .description('タスクを完了する')
    .argument('<id>', 'タスクID')
    .action((idStr: string) => {
      try {
        const id = parseTaskId(idStr);
        const task = taskService.completeTask(id);
        console.log(`タスク #${task.id} を完了しました`);
      } catch (error) {
        handleError(error);
      }
    });
}
