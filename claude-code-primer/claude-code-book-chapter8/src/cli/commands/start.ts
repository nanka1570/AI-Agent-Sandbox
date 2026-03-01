import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { parseTaskId } from '../utils/validation.js';
import { handleError } from '../error-handler.js';

export function registerStartCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('start')
    .description('タスクを開始する（ブランチ自動作成）')
    .argument('<id>', 'タスクID')
    .action(async (idStr: string) => {
      try {
        const id = parseTaskId(idStr);
        const result = await taskService.startTask(id);

        if (result.gitWarning) {
          console.warn(`警告: ${result.gitWarning}`);
        }
        if (result.hasUncommittedChanges) {
          console.warn(
            '警告: 未コミットの変更があります。ブランチを切り替えると変更が引き継がれます'
          );
        }

        console.log(`タスク #${result.task.id} を開始しました`);
        if (result.task.branch) {
          if (result.branchCreated) {
            console.log(
              `ブランチを作成しました: ${result.task.branch}`
            );
          } else {
            console.log(
              `既存ブランチにチェックアウトしました: ${result.task.branch}`
            );
          }
        }
      } catch (error) {
        handleError(error);
      }
    });
}
