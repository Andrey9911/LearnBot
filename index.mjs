import { createBot } from './src/bot/createBot.mjs';
import { config } from './src/core/config.mjs';

/** Starts the Telegram bot using the validated application configuration. */
async function startBot() {
  const bot = createBot(config.botToken);
  await bot.start({
    onStart: ({ username }) => console.log(`LearnBot @${username} started`),
  });
}

startBot().catch((error) => {
  console.error('LearnBot failed to start:', error);
  process.exitCode = 1;
});

