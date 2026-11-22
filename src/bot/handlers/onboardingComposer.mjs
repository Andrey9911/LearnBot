import { Composer } from 'grammy';

import { ONBOARDING_CALLBACKS } from '../callbacks/onboardingCallbacks.mjs';
import { diagnosticKeyboard } from '../keyboards/onboardingKeyboards.mjs';
import { ONBOARDING_STATES } from '../states/onboardingStates.mjs';
import { ONBOARDING_MESSAGES } from '../views/onboardingMessages.mjs';
import { resetCourseProgress } from '../../domain/course/courseProgress.mjs';

export const onboardingComposer = new Composer();

/** Applies a unique FSM state for a selected active learning track. */
async function selectTrack(ctx, state, track) {
  ctx.session.onboardingState = state;
  ctx.session.selectedTrack = track;
  resetCourseProgress(ctx.session);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ONBOARDING_MESSAGES.DIAGNOSTIC, {
    parse_mode: 'HTML',
    reply_markup: diagnosticKeyboard,
  });
}

/** Applies a unique FSM state for a future course button. */
async function selectLockedCourse(ctx, state) {
  ctx.session.onboardingState = state;
  await ctx.answerCallbackQuery({ text: 'Курс скоро появится' });
  await ctx.reply(ONBOARDING_MESSAGES.LOCKED_COURSE);
}

/** Applies a unique diagnostic state and displays the static calibration shell. */
async function selectDiagnosticChoice(ctx, state, choice) {
  ctx.session.onboardingState = state;
  ctx.session.diagnosticChoice = choice;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ONBOARDING_MESSAGES.CALIBRATION_TASK, {
    parse_mode: 'HTML',
  });
}

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.TRACK_BLOCKCHAIN,
  (ctx) =>
    selectTrack(
      ctx,
      ONBOARDING_STATES.TRACK_BLOCKCHAIN_SELECTED,
      'blockchain',
    ),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.TRACK_TRADING,
  (ctx) =>
    selectTrack(ctx, ONBOARDING_STATES.TRACK_TRADING_SELECTED, 'trading'),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.LOCKED_BUSINESS,
  (ctx) => selectLockedCourse(ctx, ONBOARDING_STATES.LOCKED_BUSINESS_SELECTED),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.LOCKED_IT,
  (ctx) => selectLockedCourse(ctx, ONBOARDING_STATES.LOCKED_IT_SELECTED),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.DIAGNOSTIC_NEWCOMER,
  (ctx) =>
    selectDiagnosticChoice(
      ctx,
      ONBOARDING_STATES.DIAGNOSTIC_NEWCOMER_SELECTED,
      'newcomer',
    ),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.DIAGNOSTIC_BASIC,
  (ctx) =>
    selectDiagnosticChoice(
      ctx,
      ONBOARDING_STATES.DIAGNOSTIC_BASIC_SELECTED,
      'basic',
    ),
);

onboardingComposer.callbackQuery(
  ONBOARDING_CALLBACKS.DIAGNOSTIC_CONFIDENT,
  (ctx) =>
    selectDiagnosticChoice(
      ctx,
      ONBOARDING_STATES.DIAGNOSTIC_CONFIDENT_SELECTED,
      'confident',
    ),
);

