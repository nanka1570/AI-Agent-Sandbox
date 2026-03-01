import {
  TaskNotFoundError,
  ValidationError,
  StatusTransitionError,
} from '../types/task.js';

export function handleError(error: unknown): never {
  if (error instanceof ValidationError) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
  if (error instanceof TaskNotFoundError) {
    console.error(`エラー: ${error.message}`);
    console.error(
      'ヒント: `task list` で既存のタスクを確認してください'
    );
    process.exit(1);
  }
  if (error instanceof StatusTransitionError) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
  console.error('予期しないエラーが発生しました');
  console.error(
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
}
