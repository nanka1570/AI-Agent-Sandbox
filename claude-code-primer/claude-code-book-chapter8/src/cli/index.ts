#!/usr/bin/env node

import { Command } from 'commander';
import { Storage } from '../services/storage.js';
import { GitService } from '../services/git-service.js';
import { TaskService } from '../services/task-service.js';
import { registerAddCommand } from './commands/add.js';
import { registerListCommand } from './commands/list.js';
import { registerShowCommand } from './commands/show.js';
import { registerStartCommand } from './commands/start.js';
import { registerDoneCommand } from './commands/done.js';
import { registerDeleteCommand } from './commands/delete.js';
import { registerArchiveCommand } from './commands/archive.js';

const storage = new Storage(process.cwd());
const gitService = new GitService(process.cwd());
const taskService = new TaskService(storage, gitService);

// 初回実行時のガイダンス
if (!storage.exists()) {
  storage.initialize();
  console.log('TaskCLI を初期化しました (.taskcli/)');
  console.log('');
  console.log(
    'ヒント: .taskcli/ をGitで管理する場合、チームでタスクを共有できます。'
  );
  console.log(
    '管理しない場合は .gitignore に追加してください:'
  );
  console.log("  echo '.taskcli/' >> .gitignore");
  console.log('');
  console.log('クイックスタート:');
  console.log(
    '  task add "最初のタスク"    タスクを作成'
  );
  console.log(
    '  task list                  一覧を表示'
  );
  console.log(
    '  task start 1               タスクを開始（ブランチ自動作成）'
  );
  console.log(
    '  task done 1                タスクを完了'
  );
  console.log('');
}

const program = new Command();

program
  .name('task')
  .description('TaskCLI - Gitと一体化したターミナル完結型タスク管理ツール')
  .version('0.1.0');

registerAddCommand(program, taskService);
registerListCommand(program, taskService);
registerShowCommand(program, taskService);
registerStartCommand(program, taskService);
registerDoneCommand(program, taskService);
registerDeleteCommand(program, taskService);
registerArchiveCommand(program, taskService);

program.parse();
