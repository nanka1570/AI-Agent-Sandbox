import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { GitService } from '../../services/gitService.js';
import { TaskWorkflow, TaskWorkflowError } from '../../services/taskWorkflow.js';
import { Formatter } from '../utils/formatter.js';
import { Validator } from '../utils/validation.js';

/**
 * Handle task done command
 */
export async function handleDoneCommand(idInput: string): Promise<void> {
  try {
    // Validate and parse task ID
    const { taskId, error } = Validator.parseTaskId(idInput);
    if (error) {
      console.error(Formatter.error(error));
      console.log(Formatter.info('Usage: task done <id>'));
      console.log(Formatter.info('Example: task done 1'));
      process.exit(1);
    }

    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);
    const gitService = new GitService();
    const taskWorkflow = new TaskWorkflow(taskService, gitService);

    // Pre-flight check
    console.log(Formatter.info(`Checking if task #${taskId} can be completed...`));

    const canComplete = await taskWorkflow.canCompleteTask(taskId);
    if (!canComplete.canComplete) {
      console.error(Formatter.error(`Cannot complete task #${taskId}: ${canComplete.reason}`));

      // Provide helpful suggestions based on the reason
      if (canComplete.reason?.includes('not found')) {
        console.log('');
        console.log(Formatter.info('List all tasks with:'));
        console.log('  task list');
      } else if (canComplete.reason?.includes('not in progress')) {
        console.log('');
        console.log(Formatter.info('Only tasks that are in progress can be completed.'));
        console.log(Formatter.info('Start a task first with:'));
        console.log('  task start <id>');
      }

      process.exit(1);
    }

    // Get task for display (before completion)
    const task = await taskService.getTask(taskId);
    if (!task) {
      console.error(Formatter.error(`Task #${taskId} not found`));
      process.exit(1);
    }

    // Complete the task
    console.log('');
    console.log(Formatter.info(`Completing task: ${Formatter.formatTaskId(task)} ${task.title}`));

    const completedTask = await taskWorkflow.completeTask(taskId);

    // Success message
    console.log('');
    console.log(Formatter.success('Task completed successfully!'));
    console.log('');

    // Display completed task information
    console.log(`${Formatter.formatTaskId(completedTask)} ${completedTask.title}`);
    console.log(`Status: ${Formatter.formatStatus(completedTask.status)}`);

    if (completedTask.branch) {
      console.log(`Branch: ${Formatter.formatBranch(completedTask.branch)}`);
    }

    console.log(`Completed: ${Formatter.formatDate(completedTask.completedAt || completedTask.updatedAt)}`);

    // Calculate and show duration
    if (completedTask.completedAt && completedTask.createdAt) {
      const durationMs = completedTask.completedAt.getTime() - completedTask.createdAt.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      if (durationMinutes > 0) {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        let durationText = '';

        if (hours > 0) {
          durationText += `${hours} hour${hours === 1 ? '' : 's'}`;
        }
        if (minutes > 0) {
          if (hours > 0) durationText += ' ';
          durationText += `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }

        if (durationText) {
          console.log(`Duration: ${durationText}`);
        }
      }
    }

    console.log('');
    console.log(Formatter.success('Great job! 🎉'));

    // Show next steps
    const remainingTasks = (await taskService.listTasks()).filter(t => t.status === 'open').length;
    if (remainingTasks > 0) {
      console.log('');
      console.log(Formatter.info(`You have ${remainingTasks} more task${remainingTasks === 1 ? '' : 's'} to work on.`));
      console.log(Formatter.info('List all tasks with:'));
      console.log('  task list');
    }

  } catch (error) {
    console.log(''); // Add spacing before error

    if (error instanceof TaskWorkflowError) {
      console.error(Formatter.error('Task workflow error:'));
      console.error(error.message);

      // Show cause if available
      if (error.cause) {
        console.log('');
        console.log(Formatter.info('Technical details:'));
        console.log(error.cause.message);
      }
    } else {
      console.error(Formatter.error('Failed to complete task:'));
      console.error(error instanceof Error ? error.message : String(error));
    }

    process.exit(1);
  }
}