import { Bot } from 'grammy';

import { calibrationComposer } from './handlers/calibrationComposer.mjs';
import { courseComposer } from './handlers/courseComposer.mjs';
import { onboardingComposer } from './handlers/onboardingComposer.mjs';
import { startComposer } from './handlers/startComposer.mjs';
import { sessionMiddleware } from './middlewares/sessionMiddleware.mjs';

/** Creates and wires the grammY bot with the onboarding composer tree. */
export function createBot(token) {
  const bot = new Bot(token);

  bot.use(sessionMiddleware);
  bot.use(startComposer);
  bot.use(onboardingComposer);
  bot.use(calibrationComposer);
  bot.use(courseComposer);

  bot.catch(({ error }) => {
    console.error('Unhandled Telegram update error:', error);
  });

  return bot;
}

