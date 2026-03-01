const MAX_SLUG_LENGTH = 50;

export function generateBranchName(taskId: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH);

  if (slug) {
    return `feature/task-${taskId}-${slug}`;
  }
  return `feature/task-${taskId}`;
}
