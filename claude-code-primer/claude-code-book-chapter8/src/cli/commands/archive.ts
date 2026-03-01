import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { parseTaskId } from '../utils/validation.js';
import { handleError } from '../error-handler.js';

export function registerArchiveCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('archive')
    .description('タスクをアーカイブする')
    .argument('<id>', 'タスクID')
    .action((idStr: string) => {
      try {
        const id = parseTaskId(idStr);
        const task = taskService.archiveTask(id);
        console.log(`タスク #${task.id} をアーカイブしました`);
      } catch (error) {
        handleError(error);
      }
    });
}
