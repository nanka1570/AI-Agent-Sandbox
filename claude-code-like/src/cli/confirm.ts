import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';

export async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    const answer = await rl.question(chalk.yellow(`${message}\n実行しますか? (y/n): `));
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}
