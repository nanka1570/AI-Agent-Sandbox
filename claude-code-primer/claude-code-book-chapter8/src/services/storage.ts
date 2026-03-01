import fs from 'node:fs';
import path from 'node:path';
import type { TaskStore } from '../types/task.js';

const TASKS_FILE = 'tasks.json';
const TASKS_DIR = '.taskcli';

function createInitialStore(): TaskStore {
  return { version: 1, nextId: 1, tasks: [] };
}

export class Storage {
  private dirPath: string;
  private filePath: string;

  constructor(basePath: string) {
    this.dirPath = path.join(basePath, TASKS_DIR);
    this.filePath = path.join(this.dirPath, TASKS_FILE);
  }

  load(): TaskStore {
    if (!fs.existsSync(this.filePath)) {
      return createInitialStore();
    }
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data) as TaskStore;
    } catch {
      throw new Error(
        'データファイルが破損しています。.taskcli/tasks.json を確認してください'
      );
    }
  }

  save(store: TaskStore): void {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
    const tmpPath = this.filePath + '.tmp';
    const data = JSON.stringify(store, null, 2) + '\n';
    fs.writeFileSync(tmpPath, data, 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  exists(): boolean {
    return fs.existsSync(this.dirPath);
  }

  initialize(): void {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }
}
