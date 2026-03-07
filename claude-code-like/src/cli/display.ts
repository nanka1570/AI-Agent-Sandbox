import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { marked } from 'marked';
// @ts-expect-error marked-terminal has no type declarations
import { markedTerminal } from 'marked-terminal';
import { diffLines } from 'diff';

// Markdown ターミナルレンダリングの設定
marked.use(markedTerminal() as Parameters<typeof marked.use>[0]);

// スピナーのシングルトン管理
let spinner: Ora | null = null;

export function startSpinner(text = '考え中...'): void {
  if (spinner) {
    spinner.stop();
  }
  spinner = ora({ text, spinner: 'dots' }).start();
}

export function stopSpinner(): void {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}

export function displayToolCall(toolName: string, summary: string): void {
  stopSpinner();
  process.stdout.write(chalk.cyan(`[${toolName}] `) + chalk.gray(summary) + '\n');
}

export function displayError(message: string): void {
  stopSpinner();
  process.stderr.write(chalk.red(`エラー: ${message}`) + '\n');
}

export function displayWarning(message: string): void {
  stopSpinner();
  process.stderr.write(chalk.yellow(message) + '\n');
}

export function displayToken(token: string): void {
  stopSpinner();
  process.stdout.write(token);
}

export function displayNewline(): void {
  process.stdout.write('\n');
}

export function renderMarkdown(text: string): string {
  return marked.parse(text) as string;
}

export function formatDiff(oldStr: string, newStr: string): string {
  const changes = diffLines(oldStr, newStr);
  let result = '';
  for (const change of changes) {
    const lines = change.value.replace(/\n$/, '').split('\n');
    for (const line of lines) {
      if (change.added) {
        result += chalk.green(`+ ${line}`) + '\n';
      } else if (change.removed) {
        result += chalk.red(`- ${line}`) + '\n';
      } else {
        result += chalk.gray(`  ${line}`) + '\n';
      }
    }
  }
  return result;
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
