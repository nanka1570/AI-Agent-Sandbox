import chalk from 'chalk';

export function displayToolCall(toolName: string, summary: string): void {
  process.stdout.write(chalk.cyan(`[${toolName}] `) + chalk.gray(summary) + '\n');
}

export function displayError(message: string): void {
  process.stderr.write(chalk.red(`エラー: ${message}`) + '\n');
}

export function displayWarning(message: string): void {
  process.stderr.write(chalk.yellow(message) + '\n');
}

export function displayToken(token: string): void {
  process.stdout.write(token);
}

export function displayNewline(): void {
  process.stdout.write('\n');
}

export function displayPrompt(): void {
  process.stdout.write(chalk.green('\n> '));
}

export function displayWelcome(providerName?: string, modelId?: string): void {
  console.log(chalk.bold('ClaudeCode-Like AI Agent'));
  if (providerName) {
    const modelPart = modelId ? ` (${modelId})` : '';
    console.log(chalk.gray(`Provider: ${providerName}${modelPart}`));
  }
  console.log(chalk.gray('終了: /exit | ヘルプ: /help'));
  console.log();
}

export function displayHelp(commands: Array<{ name: string; description: string }>): void {
  console.log(chalk.bold('\n利用可能なコマンド:'));
  console.log(chalk.gray('  /help') + '  - このヘルプを表示');
  for (const cmd of commands) {
    console.log(chalk.gray(`  /${cmd.name}`) + `  - ${cmd.description}`);
  }
  console.log();
}
