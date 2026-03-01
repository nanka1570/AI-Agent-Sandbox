import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { GitService } from '../../services/gitService.js';
import { TaskWorkflow, TaskWorkflowError } from '../../services/taskWorkflow.js';
import { Formatter } from '../utils/formatter.js';
import { Validator } from '../utils/validation.js';

/**
 * Handle task start command
 */
export async function handleStartCommand(idInput: string): Promise<void> {
  try {
    // Validate and parse task ID
    const { taskId, error } = Validator.parseTaskId(idInput);
    if (error) {
      console.error(Formatter.error(error));
      console.log(Formatter.info('Usage: task start <id>'));
      console.log(Formatter.info('Example: task start 1'));
      process.exit(1);
    }

    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);
    const gitService = new GitService();
    const taskWorkflow = new TaskWorkflow(taskService, gitService);

    // Pre-flight check
    console.log(Formatter.info(`Checking if task #${taskId} can be started...`));

    const canStart = await taskWorkflow.canStartTask(taskId);
    if (!canStart.canStart) {
      console.error(Formatter.error(`Cannot start task #${taskId}: ${canStart.reason}`));

      // Provide helpful suggestions based on the reason
      if (canStart.reason?.includes('not found')) {
        console.log('');
        console.log(Formatter.info('List all tasks with:'));
        console.log('  task list');
      } else if (canStart.reason?.includes('already active')) {
        console.log('');
        console.log(Formatter.info('Complete the active task first with:'));
        console.log('  task done <id>');
      } else if (canStart.reason?.includes('Not a Git repository')) {
        console.log('');
        console.log(Formatter.info('Initialize a Git repository with:'));
        console.log('  git init');
      } else if (canStart.reason?.includes('already exists')) {
        console.log('');
        console.log(Formatter.info('Delete the existing branch or use a different task title.'));
      }

      process.exit(1);
    }

    // Get task for display
    const task = await taskService.getTask(taskId);
    if (!task) {
      console.error(Formatter.error(`Task #${taskId} not found`));
      process.exit(1);
    }

    // Start the task
    console.log('');
    console.log(Formatter.info(`Starting task: ${Formatter.formatTaskId(task)} ${task.title}`));

    const result = await taskWorkflow.startTask(taskId);

    // Success message
    console.log('');
    console.log(Formatter.success('Task started successfully!'));
    console.log('');

    // Display task information
    console.log(`${Formatter.formatTaskId(result.task)} ${result.task.title}`);
    console.log(`Status: ${Formatter.formatStatus(result.task.status)}`);
    console.log(`Branch: ${Formatter.formatBranch(result.branchName)}`);
    console.log(`Started: ${Formatter.formatDate(result.task.updatedAt)}`);

    console.log('');
    console.log(Formatter.info('You are now working on this task.'));
    console.log(Formatter.info(`Git branch '${result.branchName}' has been created and checked out.`));
    console.log('');
    console.log(Formatter.info('When you\'re done, mark the task as completed with:'));
    console.log(`  task done ${taskId}`);

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
      console.error(Formatter.error('Failed to start task:'));
      console.error(error instanceof Error ? error.message : String(error));
    }

    // Show current workflow status for debugging
    try {
      const storageService = new StorageService();
      const taskService = new TaskService(storageService);
      const gitService = new GitService();
      const taskWorkflow = new TaskWorkflow(taskService, gitService);

      const status = await taskWorkflow.getWorkflowStatus();

      console.log('');
      console.log(Formatter.info('Current status:'));
      console.log(`  Git repository: ${status.isGitRepo ? 'Yes' : 'No'}`);
      console.log(`  Current branch: ${status.currentBranch || 'N/A'}`);
      console.log(`  Active task: ${status.activeTask ? `#${status.activeTask.id} ${status.activeTask.title}` : 'None'}`);
      console.log(`  Branch sync: ${status.branchSyncStatus}`);
    } catch {
      // Ignore status check errors
    }

    process.exit(1);
  }
}