import { Composer } from 'grammy';

import {
  ONBOARDING_STATES,
  TEXT_ANSWER_STATES,
} from '../states/onboardingStates.mjs';
import { ONBOARDING_MESSAGES } from '../views/onboardingMessages.mjs';
import { aiService } from '../../services/llm/aiService.mjs';
import { calibrationResultKeyboard } from '../keyboards/courseKeyboards.mjs';
import { buildCalibrationResult } from '../views/courseMessages.mjs';

export const calibrationComposer = new Composer();

/** Evaluates a diagnostic answer and saves the resulting English level in the session. */
export async function handleCalibrationAnswer(ctx) {
  if (!TEXT_ANSWER_STATES.includes(ctx.session.onboardingState)) {
    return;
  }

  ctx.session.onboardingState = ONBOARDING_STATES.CALIBRATION_ANSWER_RECEIVED;
  await ctx.reply(ONBOARDING_MESSAGES.ANSWER_RECEIVED);

  const { verdict } = await aiService.evaluateCalibrationAnswer(ctx, ctx.message.text);
  ctx.session.englishScore = verdict.english_score;
  ctx.session.englishLevel = verdict.level;
  ctx.session.onboardingState = ONBOARDING_STATES.CALIBRATION_EVALUATED;
  await ctx.reply(buildCalibrationResult(verdict), {
    parse_mode: 'HTML',
    reply_markup: calibrationResultKeyboard(),
  });

  return verdict;
}

calibrationComposer.on('message:text', handleCalibrationAnswer);

