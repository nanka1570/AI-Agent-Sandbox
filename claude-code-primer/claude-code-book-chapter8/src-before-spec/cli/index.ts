#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handleAddCommand } from './commands/add.js';
import { handleListCommand } from './commands/list.js';
import { handleShowCommand } from './commands/show.js';
import { handleStartCommand } from './commands/start.js';
import { handleDoneCommand } from './commands/done.js';
import { handleDeleteCommand } from './commands/delete.js';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

/**
 * CLI entry point for TaskCLI
 */
async function main() {
  const program = new Command();

  program
    .name('task')
    .description('TaskCLI - Git-integrated task management tool')
    .version(packageJson.version);

  // Add command
  program
    .command('add <title>')
    .description('Add a new task')
    .action(handleAddCommand);

  // List command
  program
    .command('list')
    .description('List all tasks')
    .action(handleListCommand);

  // Show command
  program
    .command('show <id>')
    .description('Show task details')
    .action(handleShowCommand);

  // Start command
  program
    .command('start <id>')
    .description('Start working on a task')
    .action(handleStartCommand);

  // Done command
  program
    .command('done <id>')
    .description('Mark task as completed')
    .action(handleDoneCommand);

  // Delete command
  program
    .command('delete <id>')
    .description('Delete a task')
    .action(handleDeleteCommand);

  // Help command
  program
    .command('help [command]')
    .description('Display help for command')
    .action((command?: string) => {
      if (command) {
        const cmd = program.commands.find(c => c.name() === command);
        if (cmd) {
          cmd.help();
        } else {
          console.error(`Unknown command: ${command}`);
          process.exit(1);
        }
      } else {
        program.help();
      }
    });

  // Parse command line arguments
  program.parse();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error('CLI error:', error);
  process.exit(1);
});