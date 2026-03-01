import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { Formatter } from '../utils/formatter.js';
import { Validator } from '../utils/validation.js';
import { TaskStatus } from '../../types/task.js';

/**
 * Handle task show command
 */
export async function handleShowCommand(idInput: string): Promise<void> {
  try {
    // Validate and parse task ID
    const { taskId, error } = Validator.parseTaskId(idInput);
    if (error) {
      console.error(Formatter.error(error));
      console.log(Formatter.info('Usage: task show <id>'));
      console.log(Formatter.info('Example: task show 1'));
      process.exit(1);
    }

    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);

    // Get task
    const task = await taskService.getTask(taskId);

    if (!task) {
      console.error(Formatter.error(`Task #${taskId} not found.`));
      console.log('');
      console.log(Formatter.info('List all tasks with:'));
      console.log('  task list');
      process.exit(1);
    }

    // Display task details
    console.log(Formatter.formatTaskDetails(task));

    // Show additional info based on status
    console.log('');

    switch (task.status) {
      case TaskStatus.OPEN:
        console.log(Formatter.info('Available actions:'));
        console.log(`  task start ${task.id}  - Start working on this task`);
        console.log(`  task delete ${task.id} - Delete this task`);
        break;

      case TaskStatus.IN_PROGRESS:
        console.log(Formatter.warning('This task is currently active.'));
        if (task.branch) {
          console.log(Formatter.info(`Git branch: ${task.branch}`));
        }
        console.log('');
        console.log(Formatter.info('Available actions:'));
        console.log(`  task done ${task.id}   - Mark as completed`);
        break;

      case TaskStatus.COMPLETED: {
        console.log(Formatter.success('This task is completed!'));
        const duration = task.completedAt && task.createdAt
          ? Math.round((task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60))
          : null;

        if (duration !== null) {
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          let durationText = '';

          if (hours > 0) {
            durationText += `${hours} hour${hours === 1 ? '' : 's'}`;
          }
          if (minutes > 0) {
            if (hours > 0) durationText += ' ';
            durationText += `${minutes} minute${minutes === 1 ? '' : 's'}`;
          }

          if (durationText) {
            console.log(Formatter.info(`Completion time: ${durationText}`));
          }
        }
        break;
      }

      case TaskStatus.ARCHIVED:
        console.log(Formatter.info('This task is archived.'));
        break;
    }

  } catch (error) {
    console.error(Formatter.error('Failed to show task:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}