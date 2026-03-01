/**
 * Application constants and configuration
 */

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  /**
   * Maximum task title length
   */
  MAX_TASK_TITLE_LENGTH: 200,

  /**
   * Maximum branch name length (for slugify)
   */
  MAX_BRANCH_SLUG_LENGTH: 30,

  /**
   * Default data directory name
   */
  DATA_DIR_NAME: '.task',

  /**
   * Tasks data file name
   */
  TASKS_FILE_NAME: 'tasks.json',

  /**
   * Temporary file suffix
   */
  TEMP_FILE_SUFFIX: '.tmp.json'
} as const;

/**
 * Application metadata
 */
export const APP_INFO = {
  /**
   * Application name
   */
  NAME: 'TaskCLI',

  /**
   * Application description
   */
  DESCRIPTION: 'Git-integrated task management tool',

  /**
   * GitHub repository URL
   */
  REPOSITORY: 'https://github.com/example/taskcli',

  /**
   * Bug report URL
   */
  BUG_REPORT_URL: 'https://github.com/example/taskcli/issues'
} as const;

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  /**
   * Task not found
   */
  TASK_NOT_FOUND: (id: number) => `Task #${id} not found`,

  /**
   * Task already in progress
   */
  TASK_ALREADY_ACTIVE: (activeId: number, activeTitle: string) =>
    `Cannot start task. Task #${activeId} "${activeTitle}" is already in progress`,

  /**
   * Task wrong status
   */
  TASK_WRONG_STATUS: (id: number, currentStatus: string, expectedStatus: string) =>
    `Task #${id} cannot be ${expectedStatus.replace('_', ' ')}. Current status: ${currentStatus}`,

  /**
   * Not a Git repository
   */
  NOT_GIT_REPO: 'This directory is not a Git repository. TaskCLI requires Git integration',

  /**
   * Branch already exists
   */
  BRANCH_EXISTS: (branchName: string) => `Branch '${branchName}' already exists`,

  /**
   * Storage error
   */
  STORAGE_ERROR: (operation: string) => `Storage operation failed: ${operation}`,

  /**
   * Git error
   */
  GIT_ERROR: (operation: string, details?: string) =>
    details ? `Git ${operation} failed: ${details}` : `Git ${operation} failed`,

  /**
   * Validation error
   */
  VALIDATION_ERROR: (field: string, reason: string) => `Invalid ${field}: ${reason}`
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  /**
   * Task created
   */
  TASK_CREATED: (id: number) => `Task #${id} created successfully`,

  /**
   * Task started
   */
  TASK_STARTED: (id: number, branchName: string) =>
    `Task #${id} started. Git branch '${branchName}' created and checked out`,

  /**
   * Task completed
   */
  TASK_COMPLETED: (id: number) => `Task #${id} completed successfully`,

  /**
   * Task deleted
   */
  TASK_DELETED: (id: number) => `Task #${id} deleted successfully`
} as const;

/**
 * Info messages
 */
export const INFO_MESSAGES = {
  /**
   * Usage examples
   */
  USAGE_EXAMPLES: {
    ADD: 'task add "Your task title"',
    LIST: 'task list',
    SHOW: 'task show 1',
    START: 'task start 1',
    DONE: 'task done 1',
    DELETE: 'task delete 1'
  },

  /**
   * Getting started
   */
  GETTING_STARTED: [
    'Create your first task with:',
    '  task add "Your task title"',
    '',
    'Then start working on it with:',
    '  task start 1'
  ].join('\n'),

  /**
   * No tasks found
   */
  NO_TASKS: [
    'No tasks found.',
    '',
    'Create your first task with:',
    '  task add "Your task title"'
  ].join('\n')
} as const;

/**
 * Exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_USAGE: 2,
  NOT_FOUND: 3,
  PERMISSION_DENIED: 4,
  CONFLICT: 5
} as const;

/**
 * File extensions and patterns
 */
export const FILE_PATTERNS = {
  /**
   * Git ignore patterns for task files
   */
  GIT_IGNORE_PATTERNS: [
    '# TaskCLI files',
    '.task/',
    '*.task.log'
  ],

  /**
   * Temporary file patterns
   */
  TEMP_FILE_PATTERNS: [
    '*.tmp',
    '*.temp',
    '*.bak'
  ]
} as const;