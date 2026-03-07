#!/usr/bin/env node

import { ProviderFactory } from './providers/provider-factory.js';
import { Repl } from './cli/repl.js';
import { loadConfig } from './config-loader.js';
import { DebugLogger } from './debug-logger.js';
import { ConversationStore } from './agent/conversation-store.js';
import { displayWelcome, displayError } from './cli/display.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = {
    resumeId: undefined as string | undefined,
    listConversations: false,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--resume') {
      const resumeId = args[i + 1];
      if (!resumeId || resumeId.startsWith('--')) {
        displayError('--resume には会話IDを指定してください');
        process.exit(1);
      }
      options.resumeId = resumeId;
      i++;
    } else if (arg === '--list') {
      options.listConversations = true;
    } else if (arg === '--debug') {
      options.debug = true;
    }
  }

  // --list は Provider 不要なので先に処理
  if (options.listConversations) {
    const store = new ConversationStore();
    const items = await store.list();
    if (items.length === 0) {
      console.log('保存された会話はありません');
    } else {
      console.log('保存された会話一覧:\n');
      for (const item of items) {
        const date = new Date(item.updatedAt).toLocaleString('ja-JP');
        console.log(`${item.id}`);
        console.log(`  ${date} - ${item.summary || '(サマリーなし)'}`);
      }
    }
    return;
  }

  const config = loadConfig();

  let providerInfo;
  try {
    providerInfo = ProviderFactory.create(config);
  } catch (error) {
    displayError((error as Error).message);
    process.exit(1);
  }

  displayWelcome(providerInfo.name, providerInfo.provider.modelId);

  const debugLogger = new DebugLogger(options.debug);
  const repl = new Repl(providerInfo.provider, { ...options, debugLogger });
  await repl.start();
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
