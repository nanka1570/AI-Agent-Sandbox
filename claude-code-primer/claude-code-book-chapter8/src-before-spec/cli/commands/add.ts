import { TaskService } from '../../services/taskService.js';
import { StorageService } from '../../services/storageService.js';
import { Formatter } from '../utils/formatter.js';
import { Validator } from '../utils/validation.js';

/**
 * Handle task add command
 */
export async function handleAddCommand(title: string): Promise<void> {
  try {
    // Validate task title
    const validationError = Validator.validateTaskTitle(title);
    if (validationError) {
      console.error(Formatter.error(validationError));
      console.log(Formatter.info('Usage: task add "Your task title"'));
      process.exit(1);
    }

    // Sanitize input
    const sanitizedTitle = Validator.sanitizeInput(title);

    // Initialize services
    const storageService = new StorageService();
    const taskService = new TaskService(storageService);

    // Create task
    const newTask = await taskService.addTask({ title: sanitizedTitle });

    // Success message
    console.log(Formatter.success(`Task created successfully!`));
    console.log('');
    console.log(`${Formatter.formatTaskId(newTask)} ${newTask.title}`);
    console.log(`Status: ${Formatter.formatStatus(newTask.status)}`);
    console.log(`Created: ${Formatter.formatDate(newTask.createdAt)}`);
    console.log('');
    console.log(Formatter.info(`Run "task start ${newTask.id}" to begin working on this task.`));

  } catch (error) {
    console.error(Formatter.error('Failed to create task:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}