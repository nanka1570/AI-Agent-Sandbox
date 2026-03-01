import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { Formatter } from '../utils/formatter.js';
import { Validator } from '../utils/validation.js';
import { TaskStatus } from '../../types/task.js';

/**
 * Handle task delete command
 */
export async function handleDeleteCommand(idInput: string): Promise<void> {
  try {
    // Validate and parse task ID
    const { taskId, error } = Validator.parseTaskId(idInput);
    if (error) {
      console.error(Formatter.error(error));
      console.log(Formatter.info('Usage: task delete <id>'));
      console.log(Formatter.info('Example: task delete 1'));
      process.exit(1);
    }

    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);

    // Check if task exists and get details
    const task = await taskService.getTask(taskId);
    if (!task) {
      console.error(Formatter.error(`Task #${taskId} not found.`));
      console.log('');
      console.log(Formatter.info('List all tasks with:'));
      console.log('  task list');
      process.exit(1);
    }

    // Warning for in-progress tasks
    if (task.status === TaskStatus.IN_PROGRESS) {
      console.log(Formatter.warning(`Warning: Task #${taskId} is currently in progress.`));
      console.log(Formatter.warning('Deleting it will not affect your current Git branch.'));
      console.log('');
    }

    // Show task details before deletion
    console.log(Formatter.info('Task to be deleted:'));
    console.log('');
    console.log(`${Formatter.formatTaskId(task)} ${task.title}`);
    console.log(`Status: ${Formatter.formatStatus(task.status)}`);
    if (task.branch) {
      console.log(`Branch: ${Formatter.formatBranch(task.branch)}`);
    }
    console.log(`Created: ${Formatter.formatDate(task.createdAt)}`);

    console.log('');
    console.log(Formatter.warning('This action cannot be undone.'));

    // Simple confirmation - ask user to type 'y' to confirm
    // Note: For MVP, we'll do a simple confirmation
    // In a full implementation, you'd use a library like 'inquirer' for better prompts
    console.log('');
    console.log('Type "y" to confirm deletion, or press Ctrl+C to cancel:');

    // Read from stdin
    const stdin = process.stdin;
    stdin.setEncoding('utf8');
    stdin.resume();

    const confirmation = await new Promise<string>((resolve) => {
      stdin.on('data', (data) => {
        resolve(data.toString().trim());
        stdin.pause();
      });
    });

    if (!Validator.isConfirmation(confirmation)) {
      console.log('');
      console.log(Formatter.info('Deletion cancelled.'));
      process.exit(0);
    }

    // Delete the task
    console.log('');
    console.log(Formatter.info(`Deleting task #${taskId}...`));

    const deleted = await taskService.deleteTask(taskId);

    if (!deleted) {
      console.error(Formatter.error(`Failed to delete task #${taskId}. Task may not exist.`));
      process.exit(1);
    }

    // Success message
    console.log(Formatter.success(`Task #${taskId} has been deleted successfully.`));
    console.log('');

    // Show summary
    const remainingTasks = await taskService.listTasks();
    console.log(Formatter.info(`Remaining tasks: ${remainingTasks.length}`));

    if (remainingTasks.length > 0) {
      console.log('');
      console.log(Formatter.info('List remaining tasks with:'));
      console.log('  task list');
    } else {
      console.log('');
      console.log(Formatter.info('No tasks remaining. Create a new task with:'));
      console.log('  task add "Your task title"');
    }

  } catch (error) {
    console.log(''); // Add spacing before error
    console.error(Formatter.error('Failed to delete task:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}