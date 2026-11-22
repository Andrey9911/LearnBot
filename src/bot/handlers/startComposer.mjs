import { Composer } from 'grammy';

import { MAIN_MENU_TEXT, mainMenuKeyboard } from '../keyboards/mainMenuKeyboard.mjs';
import { ONBOARDING_STATES } from '../states/onboardingStates.mjs';
import { ONBOARDING_MESSAGES } from '../views/onboardingMessages.mjs';
import {
  renderProgressWidget,
} from '../widgets/widgetProgressBarLearn/renderWidget.mjs';
import {directionKeyboard} from '../keyboards/onboardingKeyboards.mjs';

export const startComposer = new Composer();

/** Resets the onboarding FSM and displays the initial course selector. */
export async function handleStart(ctx) {
  ctx.session.onboardingState = ONBOARDING_STATES.CHOOSING_DIRECTION;
  ctx.session.selectedTrack = null;
  ctx.session.diagnosticChoice = null;


  await ctx.reply(ONBOARDING_MESSAGES.WELCOME, {
    parse_mode: 'HTML',
    reply_markup: directionKeyboard ,
  });
  // await sendMainMenuWidget(ctx);
}

/** Sends the Bot API 10.4 HTML widget, which is supported only in private chats. */
export async function sendMainMenuWidget(ctx) {
  if (ctx.chat?.type !== 'private') return false;

  await ctx.api.raw.sendWidget({
    chat_id: ctx.chat.id,
    html: renderProgressWidget(ctx.session),
  });
  return true;
}

startComposer.command('start', handleStart);
startComposer.hears(MAIN_MENU_TEXT, sendMainMenuWidget);

