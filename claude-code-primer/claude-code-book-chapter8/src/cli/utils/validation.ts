import { ValidationError, MAX_TITLE_LENGTH } from '../../types/task.js';

export function parseTaskId(idStr: string): number {
  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    throw new ValidationError(
      'タスクIDは正の整数で指定してください'
    );
  }
  return id;
}

export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(
      'タイトルは1〜200文字で入力してください'
    );
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(
      'タイトルは1〜200文字で入力してください'
    );
  }
  return trimmed;
}
