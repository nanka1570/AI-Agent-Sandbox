import { TaskId } from '../../types/task.js';

/**
 * Validation utilities for CLI input
 */
export class Validator {
  /**
   * Validate task title
   */
  static validateTaskTitle(title: string): string | null {
    if (!title || typeof title !== 'string') {
      return 'Task title is required';
    }

    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return 'Task title cannot be empty';
    }

    if (trimmed.length > 200) {
      return 'Task title must be 200 characters or less';
    }

    // Check for invalid characters that might cause issues with branch names
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"|?*\x00-\x1f\x7f]/;
    if (invalidChars.test(trimmed)) {
      return 'Task title contains invalid characters';
    }

    return null; // Valid
  }

  /**
   * Validate and parse task ID
   */
  static parseTaskId(idInput: string): { taskId: TaskId; error?: string } {
    if (!idInput || typeof idInput !== 'string') {
      return { taskId: 0, error: 'Task ID is required' };
    }

    // Remove # prefix if present
    const cleanInput = idInput.startsWith('#') ? idInput.slice(1) : idInput;

    const parsed = parseInt(cleanInput, 10);

    if (isNaN(parsed)) {
      return { taskId: 0, error: 'Task ID must be a number' };
    }

    if (parsed <= 0) {
      return { taskId: 0, error: 'Task ID must be a positive number' };
    }

    if (parsed > Number.MAX_SAFE_INTEGER) {
      return { taskId: 0, error: 'Task ID is too large' };
    }

    return { taskId: parsed };
  }

  /**
   * Sanitize user input for safe processing
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Trim whitespace and normalize line endings
    return input.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Validate if a string is safe for use in file paths
   */
  static isValidFileName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // Check length
    if (name.length === 0 || name.length > 255) {
      return false;
    }

    // Check for reserved names on Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(name)) {
      return false;
    }

    // Check for invalid characters
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"|?*\x00-\x1f\x7f]/;
    if (invalidChars.test(name)) {
      return false;
    }

    // Check if it starts or ends with dots or spaces
    if (name.startsWith('.') || name.endsWith('.') ||
        name.startsWith(' ') || name.endsWith(' ')) {
      return false;
    }

    return true;
  }

  /**
   * Validate branch name according to Git rules
   */
  static isValidBranchName(branchName: string): boolean {
    if (!branchName || typeof branchName !== 'string') {
      return false;
    }

    // Git branch name rules
    // - Cannot be empty
    // - Cannot start with a dot or dash
    // - Cannot contain certain characters
    // - Cannot end with a slash
    // - Cannot contain consecutive dots
    // - Must be valid ASCII

    if (branchName.length === 0) {
      return false;
    }

    if (branchName.startsWith('.') || branchName.startsWith('-')) {
      return false;
    }

    if (branchName.endsWith('/')) {
      return false;
    }

    // Invalid characters for Git branch names
    const invalidChars = /[ ~^:?*[\\]/;
    if (invalidChars.test(branchName)) {
      return false;
    }

    // Cannot contain consecutive dots
    if (branchName.includes('..')) {
      return false;
    }

    // Cannot contain @{
    if (branchName.includes('@{')) {
      return false;
    }

    // Must be valid ASCII
    // eslint-disable-next-line no-control-regex
    if (!/^[\x00-\x7F]*$/.test(branchName)) {
      return false;
    }

    return true;
  }

  /**
   * Check if input looks like a confirmation (y/yes/true)
   */
  static isConfirmation(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const normalized = input.toLowerCase().trim();
    return ['y', 'yes', 'true', '1'].includes(normalized);
  }
}