import chalk from 'chalk';
import Table from 'cli-table3';
import type { Task, TaskStatus } from '../../types/task.js';

const STATUS_COLORS: Record<TaskStatus, (text: string) => string> = {
  open: (text) => text,
  in_progress: chalk.yellow,
  completed: chalk.green,
  archived: chalk.gray,
};

export function formatTaskTable(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'タスクがありません。`task add` で最初のタスクを作成しましょう';
  }

  const table = new Table({
    head: ['ID', 'Status', 'Title', 'Branch'],
    colWidths: [6, 14, 32, 40],
    style: { head: ['cyan'] },
  });

  for (const task of tasks) {
    const colorFn = STATUS_COLORS[task.status];
    const title =
      task.title.length > 30
        ? task.title.slice(0, 29) + '…'
        : task.title;
    table.push([
      task.id.toString(),
      colorFn(task.status),
      title,
      task.branch ?? '-',
    ]);
  }

  return table.toString();
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatTaskDetail(task: Task): string {
  const lines = [
    `Task #${task.id}`,
    '─'.repeat(25),
    `Title:    ${task.title}`,
    `Status:   ${STATUS_COLORS[task.status](task.status)}`,
    `Priority: ${task.priority}`,
    `Due:      ${task.dueDate ?? '-'}`,
    `Branch:   ${task.branch ?? '-'}`,
    `Created:  ${formatDate(task.createdAt)}`,
    `Updated:  ${formatDate(task.updatedAt)}`,
  ];

  if (task.completedAt) {
    lines.push(`Done:     ${formatDate(task.completedAt)}`);
  }

  return lines.join('\n');
}
