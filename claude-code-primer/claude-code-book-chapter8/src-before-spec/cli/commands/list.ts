import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { Formatter } from '../utils/formatter.js';
import { TaskStatus } from '../../types/task.js';

/**
 * Handle task list command
 */
export async function handleListCommand(): Promise<void> {
  try {
    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);

    // Get all tasks
    const tasks = await taskService.listTasks();

    if (tasks.length === 0) {
      console.log(Formatter.info('No tasks found.'));
      console.log('');
      console.log(Formatter.info('Create your first task with:'));
      console.log('  task add "Your task title"');
      return;
    }

    // Display tasks table
    console.log(Formatter.createTasksTable(tasks));
    console.log('');

    // Show summary
    const taskCounts = await taskService.getTaskCountByStatus();
    const totalTasks = tasks.length;
    const activeTask = await taskService.getActiveTask();

    console.log(Formatter.info(`Total: ${totalTasks} tasks`));
    console.log(`  ${Formatter.getStatusColor(TaskStatus.OPEN)('●')} ${taskCounts[TaskStatus.OPEN]} open`);
    console.log(`  ${Formatter.getStatusColor(TaskStatus.IN_PROGRESS)('●')} ${taskCounts[TaskStatus.IN_PROGRESS]} in progress`);
    console.log(`  ${Formatter.getStatusColor(TaskStatus.COMPLETED)('●')} ${taskCounts[TaskStatus.COMPLETED]} completed`);

    if (taskCounts[TaskStatus.ARCHIVED] > 0) {
      console.log(`  ${Formatter.getStatusColor(TaskStatus.ARCHIVED)('●')} ${taskCounts[TaskStatus.ARCHIVED]} archived`);
    }

    // Show active task info
    if (activeTask) {
      console.log('');
      console.log(Formatter.warning(`Currently working on: ${Formatter.formatTaskId(activeTask)} ${activeTask.title}`));
      if (activeTask.branch) {
        console.log(Formatter.info(`Branch: ${Formatter.formatBranch(activeTask.branch)}`));
      }
    } else if (taskCounts[TaskStatus.OPEN] > 0) {
      console.log('');
      console.log(Formatter.info('Start working on a task with:'));
      console.log('  task start <id>');
    }

  } catch (error) {
    console.error(Formatter.error('Failed to list tasks:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}