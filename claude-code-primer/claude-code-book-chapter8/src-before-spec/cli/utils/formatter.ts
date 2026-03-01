import chalk from 'chalk';
import Table from 'cli-table3';
import { Task, TaskStatus } from '../../types/task.js';

/**
 * Format utilities for CLI output
 */
export class Formatter {
  /**
   * Get color for task status
   */
  static getStatusColor(status: TaskStatus): typeof chalk {
    switch (status) {
      case TaskStatus.OPEN:
        return chalk.gray;
      case TaskStatus.IN_PROGRESS:
        return chalk.yellow;
      case TaskStatus.COMPLETED:
        return chalk.green;
      case TaskStatus.ARCHIVED:
        return chalk.blue;
      default:
        return chalk.white;
    }
  }

  /**
   * Format status text with color
   */
  static formatStatus(status: TaskStatus): string {
    const color = this.getStatusColor(status);
    const statusText = status.replace('_', ' ').toUpperCase();
    return color(statusText);
  }

  /**
   * Format task ID with highlighting if active
   */
  static formatTaskId(task: Task): string {
    if (task.status === TaskStatus.IN_PROGRESS) {
      return chalk.bold.yellow(`#${task.id}`);
    }
    return chalk.dim(`#${task.id}`);
  }

  /**
   * Format task title with truncation if needed
   */
  static formatTaskTitle(title: string, maxLength = 50): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format branch name
   */
  static formatBranch(branch?: string): string {
    if (!branch) {
      return chalk.dim('-');
    }
    return chalk.cyan(branch);
  }

  /**
   * Format date
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format relative date (e.g., "2 days ago")
   */
  static formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return this.formatDate(date);
    }
  }

  /**
   * Create tasks table
   */
  static createTasksTable(tasks: Task[]): string {
    if (tasks.length === 0) {
      return chalk.dim('No tasks found.');
    }

    const table = new Table({
      head: ['ID', 'Status', 'Title', 'Branch', 'Updated'],
      colWidths: [6, 12, 52, 30, 20],
      style: {
        head: ['cyan'],
        border: ['gray']
      }
    });

    for (const task of tasks) {
      table.push([
        this.formatTaskId(task),
        this.formatStatus(task.status),
        this.formatTaskTitle(task.title),
        this.formatBranch(task.branch),
        chalk.dim(this.formatRelativeDate(task.updatedAt))
      ]);
    }

    return table.toString();
  }

  /**
   * Format task details for show command
   */
  static formatTaskDetails(task: Task): string {
    const lines = [
      chalk.bold.cyan('Task Details'),
      '',
      `${chalk.bold('ID:')} ${this.formatTaskId(task)}`,
      `${chalk.bold('Title:')} ${task.title}`,
      `${chalk.bold('Status:')} ${this.formatStatus(task.status)}`,
      `${chalk.bold('Branch:')} ${this.formatBranch(task.branch)}`,
      '',
      `${chalk.bold('Created:')} ${this.formatDate(task.createdAt)}`,
      `${chalk.bold('Updated:')} ${this.formatDate(task.updatedAt)}`
    ];

    if (task.completedAt) {
      lines.push(`${chalk.bold('Completed:')} ${this.formatDate(task.completedAt)}`);
    }

    return lines.join('\n');
  }

  /**
   * Format success message
   */
  static success(message: string): string {
    return chalk.green('✓ ' + message);
  }

  /**
   * Format error message
   */
  static error(message: string): string {
    return chalk.red('✗ ' + message);
  }

  /**
   * Format warning message
   */
  static warning(message: string): string {
    return chalk.yellow('⚠ ' + message);
  }

  /**
   * Format info message
   */
  static info(message: string): string {
    return chalk.blue('ℹ ' + message);
  }
}