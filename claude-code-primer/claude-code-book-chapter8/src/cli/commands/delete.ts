import readline from 'node:readline';
import type { Command } from 'commander';
import type { TaskService } from '../../services/task-service.js';
import { parseTaskId } from '../utils/validation.js';
import { handleError } from '../error-handler.js';

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

export function registerDeleteCommand(
  program: Command,
  taskService: TaskService
): void {
  program
    .command('delete')
    .description('タスクを削除する')
    .argument('<id>', 'タスクID')
    .option('-f, --force', '確認をスキップして削除する')
    .action(async (idStr: string, options: { force?: boolean }) => {
      try {
        const id = parseTaskId(idStr);
        // タスク存在確認
        taskService.getTask(id);

        if (!options.force) {
          const confirmed = await confirm(
            `タスク #${id} を削除しますか？`
          );
          if (!confirmed) {
            console.log('削除をキャンセルしました');
            return;
          }
        }

        taskService.deleteTask(id);
        console.log(`タスク #${id} を削除しました`);
      } catch (error) {
        handleError(error);
      }
    });
}
